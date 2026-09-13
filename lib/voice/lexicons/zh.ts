import type { LocaleLexicon } from "./types";

// Chinese uses Han numerals inline without spaces, so most zh parsing is
// regex-based over the normalized string (see parse-voice-query.ts). These
// tables back both the regex passes and token-level fallbacks.

const digits: Record<string, number> = {
  一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

export const zhLexicon: LocaleLexicon = {
  numberWords: { ...digits, 零: 0, 十: 10 },
  compoundTens: {},
  compoundOnes: {},
  compoundGlue: [],
  compoundOrder: "tens-first",
  // 日 doubles as a date marker (6月5日 = June 5th): the parser only treats
  // 日 as a duration unit when it does NOT directly follow a month token.
  dayUnits: ["天", "日"],
  nightUnits: ["晚", "夜"],
  weekUnits: ["周", "星期", "礼拜"],
  approximateMarkers: ["大约", "大概", "左右", "上下", "将近", "接近"],
  fromMarkers: ["从", "自从", "出发"],
  toMarkers: ["到", "去", "往", "前往", "抵达"],
  visitMarkers: ["参观", "游览", "游玩", "看", "去"],
  articles: ["的", "这", "那", "一个", "一条", "一次"],
  // Numeric months (1月…12月, 一月…十二月) are handled by rule in the parser;
  // named forms below cover ASR variants that write the numeral in Han.
  monthNames: {},
  ambiguousMonths: [],
  monthPrepositions: [],
  clauseMarkers: [],
  peopleNouns: ["人", "个人", "游客", "旅客", "宾客"],
  adultNouns: ["成人", "大人", "成年人"],
  childNouns: ["儿童", "小孩", "孩子", "小朋友"],
  infantNouns: ["婴儿", "宝宝", "婴幼儿"],
  privateWords: ["私人", "私家", "包团", "单独"],
  groupWords: ["团队", "团体", "拼团", "跟团"],
  categoryAliases: [
    { phrase: "尼罗河游轮", slug: "nile-cruises" },
    { phrase: "尼罗河邮轮", slug: "nile-cruises" },
    { phrase: "游轮", slug: "nile-cruises" },
    { phrase: "邮轮", slug: "nile-cruises" },
    { phrase: "一日游", slug: "day-tour" },
    { phrase: "一天游", slug: "day-tour" },
    { phrase: "多日游", slug: "multi-days-tours" },
    { phrase: "几天游", slug: "multi-days-tours" },
    { phrase: "特价", slug: "special-offers" },
    { phrase: "特惠", slug: "special-offers" },
  ],
  childPhrases: ["豪华尼罗河游轮", "豪华游轮", "岸上观光", "半日游", "夜游"],
  placeAliases: [
    { variant: "卢克索", canonical: "luxor" },
    { variant: "卢克素", canonical: "luxor" },
    { variant: "阿斯旺", canonical: "aswan" },
    { variant: "开罗", canonical: "cairo" },
    { variant: "吉萨", canonical: "giza" },
    { variant: "沙姆沙伊赫", canonical: "sharm-el-sheikh" },
    { variant: "洪加达", canonical: "hurghada" },
    { variant: "赫尔格达", canonical: "hurghada" },
    { variant: "亚历山大", canonical: "alexandria" },
  ],
  nonPlaceWords: [
    "豪华", "私人", "团队", "天", "晚", "周", "游轮", "十一月", "人",
    "旅行", "旅游", "旅程", "航班", "假期", "度假", "邮轮", "行程",
    "蜜月", "酒店", "我", "你", "他", "想", "要", "看",
  ],
  tourismWords: ["豪华", "博物馆", "金字塔", "家庭", "浪漫", "冒险", "海滩", "沙漠", "神庙", "寺庙", "蜜月", "历史", "文化"],
};

export const zhDigitChars = digits;