/** 디스코드 링크를 첨부할 수 있는 활동 유형 */
const DISCORD_LINK_ACTIVITY_TYPES = ["SPECIAL_LECTURE", "PROJECT", "STUDY"];

export function supportsDiscordLink(activityTypeCode?: string): boolean {
  return !!activityTypeCode &&
    DISCORD_LINK_ACTIVITY_TYPES.includes(activityTypeCode);
}

const DISCORD_HOSTS = [
  "discord.gg",
  "discord.com",
  "www.discord.com",
  "discordapp.com",
];

export function isDiscordUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && DISCORD_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
