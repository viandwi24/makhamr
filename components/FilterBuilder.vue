<script lang="ts" setup>
import { Item, GroupFilter } from '../types'

const props = defineProps({
  fields: {
    type: Array as () => string[],
    required: true
  },
  groupsFilters: {
    type: Array as () => GroupFilter[],
    required: true
  }
})

const emit = defineEmits(['apply-filter'])

const groups_filters_raw = ref<GroupFilter[]>([])

props.groupsFilters.forEach((group) => {
  groups_filters_raw.value.push({
    group_operation: group.group_operation,
    filters: group.filters.map((filter) => ({
      field: filter.field,
      operation: filter.operation,
      value: filter.value
    }))
  })
})

const apply = () => {
  emit('apply-filter', groups_filters_raw.value)
}

const add = () => {
  groups_filters_raw.value.push({
    group_operation: 'or',
    filters: [
      {
        field: props.fields[0],
        operation: 'contains',
        value: ''
      }
    ]
  })
}

</script>

<template>
  <div class="w-full bg-slate-800 rounded text-sm">
    <div class="px-4 py-2 border-b-2 border-gray-400/50">
      Filters Builder
    </div>
    <div class="px-4 py-2 flex space-y-2 flex-col">
      <div v-if="groups_filters_raw.length === 0" class="text-center">
        no filters
      </div>
      <div v-for="(g, i) in groups_filters_raw" class="px-2 py-2 bg-slate-700 rounded">
        <div class="flex justify-between">
          <div>Group #{{ i+1 }}</div>
          <div class="flex space-x-2">
            <button
              class="underline"
              @click="() => {
                groups_filters_raw[i].filters.push({
                  field: props.fields[0],
                  operation: 'contains',
                  value: ''
                })
              }"
            >
              new child
            </button>
            <button
              @click="() => {
                groups_filters_raw.splice(i, 1)
              }"
            >
              x
            </button>
          </div>
        </div>
        <div>
          <label>Group Operation</label>
            <select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent" v-model="groups_filters_raw[i].group_operation">
              <option v-for="operation in ['or', 'and']" :value="operation">{{ operation }}</option>
            </select>
        </div>
        <div v-for="(item, j) in g.filters" class="mt-2 px-2 border-t border-slate-600">
          <div class="mt-1">
            Child #{{ j+1 }}
          </div>
          <div>
            <label class="font-thin">Field</label>
            <select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent" v-model="groups_filters_raw[i].filters[j].field">
              <option v-for="field in fields" :value="field">{{ field }}</option>
            </select>
          </div>
          <div>
            <label class="font-thin">Value</label>
            <select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent" v-model="groups_filters_raw[i].filters[j].operation">
              <option v-for="operation in ['contains', 'not_contains', 'equal', 'not_equal']" :value="operation">{{ operation }}</option>
            </select>
          </div>
          <div>
            <label class="font-thin">Value</label>
            <input type="text" class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent" v-model="groups_filters_raw[i].filters[j].value" placeholder="value" />
          </div>
        </div>
      </div>
    </div>
    <div class="flex">
      <button class="w-full bg-green-700 text-xs text-gray-100 py-2" @click="apply">Apply Filter</button>
      <button class="w-full bg-slate-700 text-xs text-gray-100 py-2" @click="add">Add New Group</button>
    </div>
  </div>
</template>
