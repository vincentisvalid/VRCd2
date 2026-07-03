/**
 * CommandContext — the unification layer of the hybrid command handler.
 *
 * Every command's `execute(ctx)` receives one of these regardless of whether
 * the invocation arrived as a classic prefix message (`.ban @user spam`) or a
 * slash interaction (`/ban user:@user reason:spam`). Both transports map to
 * the exact same execution logic blocks; the context normalises replying,
 * deferral, option access, and attachment discovery.
 */
import { errorEmbed, successEmbed } from './embeds.js';

export class CommandContext {
  constructor({ client, command, subcommand = null, interaction = null, message = null, args = [], rawArgs = '', opts = new Map() }) {
    this.client = client;
    this.command = command;
    this.subcommand = subcommand;
    this.interaction = interaction;
    this.message = message;
    /** Raw positional tokens (prefix mode) or synthesised values (slash mode). */
    this.args = args;
    /** The verbatim argument string after the command name (prefix mode only). */
    this.rawArgs = rawArgs;
    /** Parsed, typed option values keyed by option name. */
    this.opts = opts;
    this._deferred = false;
    this._replied = false;
    this._sent = null;
  }

  get isSlash() {
    return this.interaction !== null;
  }

  get user() {
    return this.isSlash ? this.interaction.user : this.message.author;
  }

  get member() {
    return this.isSlash ? this.interaction.member : this.message.member;
  }

  get guild() {
    return this.isSlash ? this.interaction.guild : this.message.guild;
  }

  get channel() {
    return this.isSlash ? this.interaction.channel : this.message.channel;
  }

  /** Typed option accessor with fallback. */
  getOption(name, fallback = null) {
    const value = this.opts.get(name);
    return value === undefined || value === null ? fallback : value;
  }

  /** All attachments supplied with the invocation (message uploads or slash attachment options). */
  get attachments() {
    if (this.isSlash) {
      return [...this.opts.values()].filter((value) => value?.constructor?.name === 'Attachment');
    }
    return [...this.message.attachments.values()];
  }

  /**
   * Signals "long running work ahead". Slash: defers the interaction reply.
   * Prefix: emits a typing indicator (a best-effort cosmetic signal).
   */
  async defer({ ephemeral = false } = {}) {
    if (this.isSlash) {
      if (!this._deferred && !this._replied) {
        await this.interaction.deferReply({ ephemeral });
        this._deferred = true;
      }
      return;
    }
    await this.channel.sendTyping().catch(() => {});
  }

  /**
   * Unified reply. Handles all interaction lifecycle states (fresh, deferred,
   * already replied) and falls back to a plain channel send in prefix mode
   * when the trigger message has been purged (the AI key-security commands
   * delete the invoking message before responding).
   */
  async reply(payload) {
    const normalized = typeof payload === 'string' ? { content: payload } : { ...payload };
    if (this.isSlash) {
      if (this._deferred && !this._replied) {
        this._replied = true;
        return this.interaction.editReply(normalized);
      }
      if (this._replied) return this.interaction.followUp(normalized);
      this._replied = true;
      return this.interaction.reply({ ...normalized, fetchReply: true });
    }
    delete normalized.ephemeral; // classic messages cannot be ephemeral
    if (this._sent) return this.followUp(normalized);
    try {
      this._sent = await this.message.reply({ allowedMentions: { repliedUser: false }, ...normalized });
    } catch {
      // Trigger message may have been deleted (or reply otherwise rejected).
      this._sent = await this.channel.send(normalized);
    }
    return this._sent;
  }

  /** Edits the initial reply — used by processing embeds that later resolve. */
  async edit(payload) {
    const normalized = typeof payload === 'string' ? { content: payload } : { ...payload };
    if (this.isSlash) {
      if (this._deferred || this._replied) return this.interaction.editReply(normalized);
      return this.reply(normalized);
    }
    delete normalized.ephemeral;
    if (this._sent) return this._sent.edit(normalized);
    return this.reply(normalized);
  }

  /** Sends an additional message after the initial reply. */
  async followUp(payload) {
    const normalized = typeof payload === 'string' ? { content: payload } : { ...payload };
    if (this.isSlash) {
      if (this._replied || this._deferred) return this.interaction.followUp(normalized);
      return this.reply(normalized);
    }
    delete normalized.ephemeral;
    return this.channel.send(normalized);
  }

  /** Convenience: graceful failure embed. */
  async replyError(title, reason) {
    return this.reply({ embeds: [errorEmbed(title, reason)] });
  }

  /** Convenience: success embed. */
  async replySuccess(title, description) {
    return this.reply({ embeds: [successEmbed(title, description)] });
  }

  /** Fetches the GuildMember for a resolved User option (null when not in guild). */
  async fetchMemberOf(user) {
    if (!this.guild || !user) return null;
    return this.guild.members.fetch(user.id).catch(() => null);
  }
}

export default CommandContext;
