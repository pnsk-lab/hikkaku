<template>
  <div ref="blocklyContainer" class="blockly-container"></div>
</template>

<script setup lang="ts">
import ScratchBlocks from '@evex/scratch-blocks'
import { onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import {
  compilePackedBlocksToXml,
  type PackedBlockMap,
  stripUnsupportedNextNodes,
} from './blocklyXmlCompiler'

const props = defineProps<{
  blocks?: PackedBlockMap | null
}>()

interface BlocklyWorkspace {
  clear: () => void
  newBlock: (opcode: string) => any
  setVisible: (visible: boolean) => void
  resize: () => void
}

const blocklyContainer = useTemplateRef('blocklyContainer')
const workspaceRef = shallowRef<BlocklyWorkspace | null>(null)

const sampleBlocks: PackedBlockMap = {
  '1': {
    opcode: 'event_whenflagclicked',
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: true,
    x: 0,
    y: 0,
    next: '3',
    parent: null,
  },
  '2': {
    opcode: 'motion_movesteps',
    inputs: {
      STEPS: [1, [4, 1]],
    },
    fields: {},
    shadow: false,
    topLevel: false,
    x: 0,
    y: 0,
    next: null,
    parent: '3',
  },
  '3': {
    opcode: 'control_forever',
    inputs: {
      SUBSTACK: [2, '2'],
    },
    fields: {},
    shadow: false,
    topLevel: false,
    x: 0,
    y: 0,
    next: '5',
    parent: '1',
  },
  '4': {
    opcode: 'operator_gt',
    inputs: {
      OPERAND1: [1, [4, 10]],
      OPERAND2: [1, [4, 10]],
    },
    fields: {},
    shadow: false,
    topLevel: false,
    x: 0,
    y: 0,
    next: null,
    parent: '5',
  },
  '5': {
    opcode: 'control_if_else',
    inputs: {
      CONDITION: [1, '4'],
    },
    fields: {},
    shadow: false,
    topLevel: false,
    x: 0,
    y: 0,
    next: null,
    parent: '3',
  },
}

const renderBlocks = (blocks: PackedBlockMap | null | undefined) => {
  const workspace = workspaceRef.value
  if (!workspace) return

  workspace.clear()
  const sourceBlocks = blocks ?? sampleBlocks
  const xmlText = compilePackedBlocksToXml(sourceBlocks)
  // @ts-expect-error Type wrong
  const xml = ScratchBlocks.Xml.textToDom(xmlText)
  stripUnsupportedNextNodes(xml, (opcode) => {
    return workspace.newBlock(opcode)
  })
  // @ts-expect-error Type wrong
  ScratchBlocks.Xml.domToWorkspace(xml, workspace)
}

onMounted(() => {
  if (!blocklyContainer.value) return

  // @ts-expect-error Type wrong
  const workspace = ScratchBlocks.inject(blocklyContainer.value, {
    toolbox: {},
    scrollbars: true,
    zoom: {
      controls: true,
      startScale: 0.675,
    },
    grid: {
      spacing: 20,
      length: 3,
      colour: '#ccc',
      snap: true,
    },
  })
  workspace.setVisible(true)
  workspace.resize()
  workspaceRef.value = workspace

  renderBlocks(props.blocks)
})

watch(
  () => props.blocks,
  (nextBlocks) => {
    renderBlocks(nextBlocks)
  },
)
</script>
<style lang="css">
.blockly-container {
  width: 100%;
  height: 100%;
}
</style>
