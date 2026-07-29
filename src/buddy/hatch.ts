/**
 * v2.1.0: 孵化系统 —— 给定一个种子（用户 vault 名 + 起的名字），
 *   确定性地生成一只宠物（物种 + 稀有度 + 眼睛 + 帽子 + shiny）。
 *
 * "确定性" 意味着同一种子永远孵出同一只宠物。这样：
 *   - 用户失手把数据清空了，重新孵化还是那只熟悉的伙伴
 *   - 跨设备同步 vault 后看到的是同一只
 *
 * 算法选择：mulberry32（与 Claude Code 原版一致，致敬）
 *   - 32-bit 整数 → uniform float64
 *   - 简单、纯函数、无依赖
 *   - 周期 2^32（远超我们的需要）
 */

import {
  SpeciesId,
} from "./sprites";
import {
  Rarity,
  RARITY_WEIGHTS,
  speciesByRarity,
} from "./species";
import {
  EYE_VARIANTS,
  EyeVariant,
  HatVariant,
} from "./sprites";

/** mulberry32: 一个非常小但高质量的 32-bit PRNG */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HatchedBuddy {
  species: SpeciesId;
  rarity: Rarity;
  eye: EyeVariant;
  hat: HatVariant;
  shiny: boolean;
  /** 用户起的名字 */
  name: string;
  /** 孵化时间（ISO 字符串）—— 用来算"已陪你 N 天" */
  hatchedAt: string;
  /** 用来重新构造 PRNG 的种子（hash 值），方便后续做"成长" */
  seed: number;
}

/** 孵化主入口
 *  @param vaultName Obsidian vault 的名字（保留参数用于向后兼容，不再参与种子）
 *  @param chosenName 用户给宠物起的名字（保留参数用于向后兼容，不再参与种子）
 *
 *  v2.1.1 改为真随机：之前 seed = hash(vaultName + chosenName)，意图是
 *    "数据丢失能找回同一只 + 跨设备一致"，但实际：
 *      - 跨设备一致根本不靠这个（靠 data.json 同步）
 *      - 数据丢失场景极少触发，且用户接受"重新开始"
 *    代价是"两个用户起同名字得到一样的宠物"，违反"独一无二"直觉。
 *    改为时间戳 ^ Math.random()，每只宠物都是独立的。
 */
export function hatch(vaultName: string, chosenName: string): HatchedBuddy {
  // 真随机种子：当前时间戳 XOR 一个 32-bit 随机数
  //   ^ 不是为了密码学强度，只是把两个 32-bit 噪声源混合
  //   保证同一秒内多次孵化也能得到不同种子（虽然 hatch 实际是低频操作）
  const seed = ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
  const rng = mulberry32(seed);

  // 1) 抽稀有度（按 60/25/10/4/1）
  const rarity = pickRarity(rng);
  // 2) 在该稀有度下抽具体物种
  const pool = speciesByRarity(rarity);
  const species = pool[Math.floor(rng() * pool.length)];
  // 3) 眼睛（6 选 1）
  const eye = EYE_VARIANTS[Math.floor(rng() * EYE_VARIANTS.length)];
  // 4) 帽子 —— v2.1.0-iter10 修正 RNG 偏差：
  //    之前用 `rng() < 0.5 ? "none" : (rng()*N...)` 三元式，两个分支 rng 调用次数不同，
  //    导致后面的 shiny 概率分布在不同代码路径上有偏。现在改为"加权抽样"，
  //    把 "none" 当成一个普通选项，保证总是只调用一次 rng。
  //    权重：none=4, 其余 7 种各 1（即 50%/50% = 不戴/戴帽）
  const hatRoll = rng();
  const hatWeights: Array<[HatVariant, number]> = [
    ["none", 7],
    ["crown", 1], ["tophat", 1], ["propeller", 1], ["halo", 1],
    ["wizard", 1], ["beanie", 1], ["duckling", 1],
  ];
  const hatTotal = hatWeights.reduce((s, [, w]) => s + w, 0);
  let hatPick = hatRoll * hatTotal;
  let hat: HatVariant = "none";
  for (const [hatId, w] of hatWeights) {
    hatPick -= w;
    if (hatPick <= 0) { hat = hatId; break; }
  }
  // 5) Shiny（1% 概率，独立判定）
  const shiny = rng() < 0.01;

  return {
    species,
    rarity,
    eye,
    hat,
    shiny,
    name: chosenName.trim() || "Buddy",
    hatchedAt: new Date().toISOString(),
    seed,
  };
}

/** 按 RARITY_WEIGHTS 加权抽稀有度 */
function pickRarity(rng: () => number): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0); // = 100
  let r = rng() * total;
  for (const [rarity, w] of Object.entries(RARITY_WEIGHTS) as [Rarity, number][]) {
    r -= w;
    if (r <= 0) return rarity;
  }
  return "common"; // unreachable but TS 友好
}

/** 计算"已陪你 N 天"
 *
 *  v2.1.0-iter18 修复：之前用 `floor((now - t0) / 86400000)` 算的是
 *  "整数 24 小时数"，不是"日历天数"。导致两个 bug：
 *    - 早上 10:00 孵化，次日上午 9:00 看 → 时间差 23h → 显示 0 天
 *    - 早上 10:00 孵化，次日上午 11:00 看 → 时间差 25h → 显示 1 天
 *  用户的直觉是"日历天数"：今天孵化 = 第 1 天；明天 = 第 2 天，与时刻无关。
 *
 *  现在改为"按本地时区把日期归零到 00:00:00 后再相减"。
 */
export function daysSinceHatch(hatchedAtISO: string): number {
  try {
    const hatchedAt = new Date(hatchedAtISO);
    if (!isFinite(hatchedAt.getTime())) return 0;
    const now = new Date();
    // 把两个日期都归零到本地时区的 00:00:00
    const startOfHatch = new Date(
      hatchedAt.getFullYear(), hatchedAt.getMonth(), hatchedAt.getDate()
    ).getTime();
    const startOfToday = new Date(
      now.getFullYear(), now.getMonth(), now.getDate()
    ).getTime();
    if (startOfHatch > startOfToday) return 0; // 防御：孵化时间在未来
    return Math.round((startOfToday - startOfHatch) / 86400000);
  } catch {
    return 0;
  }
}
