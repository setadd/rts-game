import type { Entity } from '@/engine/entity/Entity'
import type { Trait } from '@/engine/entity/Trait'

/**
 * 按 Trait 名称查找实体能力。
 *
 * 当前引擎的 Entity 只保存 Trait 数组，系统通过这个工具读取具体能力，避免每个系统
 * 重复编写查找逻辑。
 */
export function getTrait<TTrait extends Trait>(entity: Entity, name: TTrait['name']): TTrait | undefined {
  return entity.traits.find((trait) => trait.name === name) as TTrait | undefined
}

/**
 * 读取必需 Trait；缺失时直接抛错，暴露实体装配错误。
 */
export function requireTrait<TTrait extends Trait>(entity: Entity, name: TTrait['name']): TTrait {
  const trait = getTrait<TTrait>(entity, name)
  if (!trait) {
    throw new Error(`Entity ${entity.id} is missing trait: ${String(name)}`)
  }
  return trait
}
