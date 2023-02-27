import { resolve } from "std/path/posix.ts";
import { getLogger } from "std/log/mod.ts";
import { Bot, Context, GrammyError, HttpError, session } from "grammy/mod.ts";
import { sequentialize } from "grammy_runner/mod.ts";
import { FileAdapter } from "grammy_storages/file/src/mod.ts";
import { getInitialFilterSessionData } from "./skills/filters/mod.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import { createCurrencyApiMiddleware } from "./skills/currency/createCurrencyApiMiddleware/mod.ts";
import { injectCommand as injectCurrencyConvertCommand } from "./skills/currency/cmdConvert.ts";
import { injectCommand as injectTemperatureCommand } from "./skills/weather/cmdTemperature.ts";
import { injectCommand as injectForecastCommand } from "./skills/weather/cmdForecast.ts";
import { Configuration } from "./skills/platform/configuration/types.ts";
import { createConfigurationMiddleware } from "./skills/platform/configuration/createConfigurationMiddleware.ts";
import { createWeatherApiMiddleware } from "./skills/weather/createWeatherApiMiddleware/mod.ts";

const logger = () => getLogger("mortybot");

export const createBot = (configuration: Configuration) => {
  const bot = new Bot<BotContext>(configuration.botToken);

  const getSessionKey = (ctx: Context) => {
    return ctx.chat?.id.toString();
  };

  const initial = (): SessionData => {
    return {
      ...getInitialFilterSessionData(),
    };
  };

  bot.use(createConfigurationMiddleware(configuration));
  bot.use(createCurrencyApiMiddleware());
  bot.use(createWeatherApiMiddleware());
  bot.use(sequentialize(getSessionKey));
  bot.use(session({
    getSessionKey,
    initial,
    storage: new FileAdapter({
      dirName: resolve(configuration.dataPath, "./sessions"),
    }),
  }));

  injectCurrencyConvertCommand(bot);
  injectTemperatureCommand(bot);
  injectForecastCommand(bot);

  bot.catch((err) => {
    const ctx = err.ctx;
    logger().error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      logger().error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      logger().error("Could not contact Telegram:", e);
    } else {
      logger().error("Unknown error:", e);
    }
  });

  return bot;
};
