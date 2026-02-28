import idiomsRaw from './idioms.json'

export interface IdiomEntry {
  word: string
  pinyin: string
  /** 首字拼音（不含声调） */
  first: string
  /** 末字拼音（不含声调） */
  last: string
  meaning: string
}

/**
 * 成语数据库，提供 O(1) 级别的接龙查询
 */
export class IdiomDatabase {
  private allIdioms: IdiomEntry[]
  /** 按首字拼音分组的索引，key = first pinyin */
  private firstIndex: Map<string, IdiomEntry[]>
  /** 已使用的成语集合（word 字符串） */
  private usedWords: Set<string>

  constructor() {
    this.allIdioms = idiomsRaw as IdiomEntry[]
    this.firstIndex = new Map()
    this.usedWords = new Set()
    this.buildIndex()
  }

  private buildIndex(): void {
    for (const idiom of this.allIdioms) {
      const key = idiom.first
      if (!this.firstIndex.has(key)) {
        this.firstIndex.set(key, [])
      }
      this.firstIndex.get(key)!.push(idiom)
    }
  }

  /** 重置已使用记录（开始新一局） */
  reset(): void {
    this.usedWords.clear()
  }

  /** 标记某个成语为已使用 */
  markUsed(word: string): void {
    this.usedWords.add(word)
  }

  /** 判断是否已使用 */
  isUsed(word: string): boolean {
    return this.usedWords.has(word)
  }

  /** 判断某个词是否在词库中 */
  exists(word: string): boolean {
    return this.allIdioms.some(i => i.word === word)
  }

  /** 根据词语查找完整条目 */
  find(word: string): IdiomEntry | undefined {
    return this.allIdioms.find(i => i.word === word)
  }

  /**
   * 查找可以接在 lastPinyin 之后的成语列表（未使用的）
   * @param lastPinyin 上一个成语的末字拼音
   */
  findNext(lastPinyin: string): IdiomEntry[] {
    const candidates = this.firstIndex.get(lastPinyin) ?? []
    return candidates.filter(i => !this.usedWords.has(i.word))
  }

  /**
   * 判断某个成语能否接在上一个成语后面
   * @param word 待验证的成语
   * @param lastPinyin 上一个成语的末字拼音
   */
  canFollow(word: string, lastPinyin: string | null): boolean {
    const entry = this.find(word)
    if (!entry) return false
    if (this.isUsed(word)) return false
    if (lastPinyin === null) return true  // 第一个成语不需要检查
    return entry.first === lastPinyin
  }

  /** 随机获取一个开局成语 */
  getRandomStart(): IdiomEntry {
    const idx = Math.floor(Math.random() * this.allIdioms.length)
    return this.allIdioms[idx]
  }

  /** 获取词库总数 */
  get totalCount(): number {
    return this.allIdioms.length
  }

  /** 获取词库中所有不重复的汉字（用于键盘干扰字等） */
  getAllChars(): string[] {
    const set = new Set<string>()
    for (const entry of this.allIdioms) {
      for (const ch of entry.word) {
        set.add(ch)
      }
    }
    return Array.from(set)
  }
}
