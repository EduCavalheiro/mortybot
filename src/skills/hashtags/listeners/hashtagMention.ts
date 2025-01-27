import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const hashtagMentionListener: Middleware<
  Filter<BotContext, "message:text">
> = async (ctx) => {
  const hashtags = parseHashtags(ctx.msg.text).slice(0, 4);

  for (const hashtag of hashtags) {
    const hashtagChannel = ctx.session.hashtagChannels.get(hashtag);

    if (!hashtagChannel) {
      continue;
    }

    const mentions = await Promise.all(
      hashtagChannel.participants.map(async (userId) => {
        const { user } = await ctx.getChatMember(userId);
        const mention = createMemberMention(user, false);
        return mention;
      }),
    );

    const mentionChunks = getChunks(mentions);

    for (const mentionChunk of mentionChunks) {
      const message = `
${hashtag}: ${mentionChunk.join(",")}
`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.msg.message_id,
      });
    }
  }
};
