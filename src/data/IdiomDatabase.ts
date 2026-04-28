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
  /** 按 word 的快速查找索引 */
  private wordIndex: Map<string, IdiomEntry>
  /** 已使用的成语集合（word 字符串） */
  private usedWords: Set<string>
  /** 所有不重复汉字的缓存 */
  private _allCharsCache: string[] | null = null

  constructor() {
    this.allIdioms = idiomsRaw as IdiomEntry[]
    this.firstIndex = new Map()
    this.wordIndex = new Map()
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
      this.wordIndex.set(idiom.word, idiom)
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
    return this.wordIndex.has(word)
  }

  /** 根据词语查找完整条目 */
  find(word: string): IdiomEntry | undefined {
    return this.wordIndex.get(word)
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

  /** 随机获取一个开局成语（保证末字拼音有可接的后续成语） */
  getRandomStart(): IdiomEntry {
    if (this.allIdioms.length === 0) throw new Error('词库为空，无法获取开局成语')
    const candidates = this.allIdioms.filter(
      e => (this.firstIndex.get(e.last)?.length ?? 0) >= 2,
    )
    const pool = candidates.length > 0 ? candidates : this.allIdioms
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /** 获取词库总数 */
  get totalCount(): number {
    return this.allIdioms.length
  }

  /** 获取词库中所有不重复的汉字（首次调用时构建缓存） */
  getAllChars(): string[] {
    if (this._allCharsCache) return this._allCharsCache
    const set = new Set<string>()
    for (const entry of this.allIdioms) {
      for (const ch of entry.word) {
        set.add(ch)
      }
    }
    this._allCharsCache = Array.from(set)
    return this._allCharsCache
  }
}
