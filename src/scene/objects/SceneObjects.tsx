import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { SceneObjectNode } from './SceneObjectNode'

export function SceneObjects() {
  const objects = useDocumentStore((s) => s.exercise.objects)
  const selectedIds = useUiStore((s) => s.selectedIds)
  const hoveredId = useUiStore((s) => s.hoveredId)
  const preview = useUiStore((s) => s.preview)

  return (
    <group>
      {objects.map((obj) => {
        const isSelected = selectedIds.includes(obj.id)
        const isHovered = hoveredId === obj.id
        const p = preview[obj.id]
        return (
          <SceneObjectNode
            key={obj.id}
            obj={obj}
            isSelected={isSelected}
            isHovered={isHovered}
            previewPos={p?.position}
            previewRot={p?.rotation}
          />
        )
      })}
    </group>
  )
}
