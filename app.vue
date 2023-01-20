<script lang="ts" setup>
import axios from 'axios'
import { Item, GroupFilter } from './types'

const datasheets = ref<string[]>([])
const selected_datasheet = ref<string>()
const old_datasheet = ref<string>()
const options = ref({
  onlyShowNewData: false,
  highlightNewData: true
})
const datas = ref<Item[]>([])
const datasOld = ref<Item[]>([])
const loading = ref(false)
const getData = async () => {
  loading.value = true

  // get
  try {
    // get all database
    const resDB = await axios({
      method: 'GET',
      url: '/data/all.json'
    })
    datasheets.value = resDB?.data || []
    const dssorted = sortDS(datasheets.value)
    if (datasheets.value.length === 0) {
      throw new Error('no datasheet')
    }
    if (!selected_datasheet.value) {
      selected_datasheet.value = dssorted[0]
    }
    console.log('selected datasheet', selected_datasheet.value)

    // get old data
    const dsCurrIndex = dssorted.findIndex((item) => item === selected_datasheet.value)
    if (dsCurrIndex >= dssorted.length - 1) {
      datasOld.value = []
    } else {
      const { data } = await axios({
        method: 'GET',
        url: `/data/${dssorted[dsCurrIndex + 1]}.json`
      })
      datasOld.value = data
      old_datasheet.value = dssorted[dsCurrIndex + 1]
    }
    console.log('old datasheet', old_datasheet.value)

    // get data
    const { data } = await axios({
      method: 'GET',
      url: `/data/${selected_datasheet.value}.json`
    })
    datas.value = data
  } catch (error) {
    console.log(error)
  }

  // state
  loading.value = false
}

const sortDS = (d: string[]) => d.sort((a, b) => b.localeCompare(a))
const filtered_datasheets = computed(() => {
  return sortDS(datasheets.value)
})

const isNewData = (id: string) => {
  return !(datasOld.value.find((item) => item.id === id))
}

onMounted(() => {
  getData()
})


// filter builder
const fields = computed(() => {
  return datas.value.length > 0 ? Object.keys(datas.value[0]) : []
})
const groups_filters = ref<GroupFilter[]>([])
const filtered_data = computed(() => {
  const results = [...datas.value]

  if (options.value.onlyShowNewData) {
    results.splice(0, results.length, ...results.filter((item) => isNewData(item.id)))
  }

  for (const group of groups_filters.value) {
    const { group_operation, filters } = group

    if (group_operation === 'or') {
      const temp = []

      for (const filter of filters) {
        const { field, operation, value } = filter

        if (operation === 'contains') {
          temp.push(...results.filter((item) => (item as any)[field].toLowerCase().includes(value.toLowerCase())))
        }
      }

      results.splice(0, results.length, ...temp)
    } else if (group_operation === 'and') {
      for (const filter of filters) {
        const { field, operation, value } = filter

        if (operation === 'contains') {
          results.splice(0, results.length, ...results.filter((item) => (item as any)[field].toLowerCase().includes(value.toLowerCase())))
        } else if (operation === 'not_contains') {
          results.splice(0, results.length, ...results.filter((item) => !(item as any)[field].toLowerCase().includes(value.toLowerCase())))
        } else if (operation === 'equal') {
          results.splice(0, results.length, ...results.filter((item) => (item as any)[field].toLowerCase() === value.toLowerCase()))
        } else if (operation === 'not_equal') {
          results.splice(0, results.length, ...results.filter((item) => (item as any)[field].toLowerCase() !== value.toLowerCase()))
        }
      }
    }
  }

  return results
})
const applyFilter = (p: GroupFilter[]) => {
  groups_filters.value.splice(0, groups_filters.value.length)
  p.forEach((group) => {
    groups_filters.value.push({
      group_operation: group.group_operation,
      filters: group.filters.map((filter) => ({
        field: filter.field,
        operation: filter.operation,
        value: filter.value
      }))
    })
  })
}

// pagination builder
const pagination = ref({
  page: 1,
  per_page: 10
})
const displayed_data = computed(() => {
  try {
    const { page, per_page } = pagination.value
    const start = (page - 1) * per_page
    const end = start + per_page
    return filtered_data.value.slice(start, end)
  } catch (error) {
    pagination.value.page = 1
    pagination.value.per_page = 10
    return filtered_data.value
  }
})
const pagination_page_count = computed(() => {
  return Math.ceil(filtered_data.value.length / pagination.value.per_page)
})
const pagination_current_started_index = computed(() => {
  return (pagination.value.page - 1) * pagination.value.per_page + 1
})

</script>

<template>
  <div class="w-screen h-screen flex bg-slate-900 text-gray-100">
    <div class="max-w-screen-lg w-full mx-auto py-8 flex flex-col items-center justify-center">
      <div class="flex-1 py-20 max-h-full w-full flex space-x-4">
        <div class="flex-1">
          <div class="text-center mb-2 text-sm">
            <span class="mr-2 font-bold">{{ filtered_data.length }}</span>
            <span class="mr-2">filtered data from</span>
            <span class="mr-2 font-bold">{{ datas.length }}</span>
            <span class="mr-2">data</span>
          </div>
          <div class="mt-2 mb-6 flex">
            <!-- page -->
            <div class="flex space-x-2 items-center">
              <div>Per Page Item : </div>
              <div class="flex-1">
                <select v-model="pagination.per_page" class="w-full">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                  <option value="2000">2000</option>
                  <option value="2000">999999999999999</option>
                </select>
              </div>
            </div>
          </div>
          <table class="border-collapse table-fixed w-full text-sm max-h-full">
            <thead>
              <tr class="w-full">
                <th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left" width="5%">#</th>
                <th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left" width="15%"></th>
                <th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left">Nama / Perusahaan</th>
                <th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left"></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loading">
                <tr>
                  <td colspan="4" class="text-center">Loading...</td>
                </tr>
              </template>
              <template v-if="!loading">
                <tr v-for="(item, i) in displayed_data" :key="Math.random()">
                  <td class="border-b border-slate-200/80 p-4 text-slate-200" width="5%" :class="{ 'bg-green-600/60': options.highlightNewData && isNewData(item.id) }">
                    {{ i+pagination_current_started_index }}
                  </td>
                  <td class="border-b border-slate-200/80 p-4 text-slate-200" width="15%" :class="{ 'bg-green-600/60': options.highlightNewData && isNewData(item.id) }">
                    <div class="text-center flex justify-center items-center">
                      <img class="w-10 h-10 rounded-full" :src="item.logo" alt="avatar">
                    </div>
                  </td>
                  <td class="border-b border-slate-200/80 p-4 text-slate-200" :class="{ 'bg-green-600/60': options.highlightNewData && isNewData(item.id) }">
                    <div class="font-bold">{{ item.name }}</div>
                    <div class="text-xs">
                      <span>{{ item.activity_name }}</span>
                      <span class="font-semibold">({{ item.mitra_name }})</span>
                    </div>
                  </td>
                  <td class="border-b border-slate-200/80 p-4 text-slate-200" :class="{ 'bg-green-600/60': options.highlightNewData && isNewData(item.id) }">
                    <div class="flex space-x-2">
                      <a
                        :href="`https://kampusmerdeka.kemdikbud.go.id/program/magang/browse/${item.mitra_id}/${item.id}`"
                        target="_blank"
                        class="text-xs text-blue-400 underline"
                      >
                        Buka di kampusmerdeka
                      </a>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div class="mt-2">
            <!-- pagination -->
            <div class="flex justify-between items-center">
              <div class="flex space-x-2">
                <button
                  class="px-2 py-1 rounded bg-slate-800/50 text-xs text-gray-400"
                  :class="{ 'text-gray-200': pagination.page > 1 }"
                  :disabled="pagination.page <= 1"
                  @click="() => pagination.page--"
                >
                  Prev
                </button>
                <button
                  class="px-2 py-1 rounded bg-slate-800/50 text-xs text-gray-400"
                  :class="{ 'text-gray-200': pagination.page < pagination_page_count }"
                  :disabled="pagination.page >= pagination_page_count"
                  @click="() => pagination.page++"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="w-[260px] flex space-y-4 flex-col">
          <div class="w-full bg-slate-800 rounded text-sm">
            <div class="px-4 py-2 border-b-2 border-gray-400/50">
              Datasheets
            </div>
            <div class="px-4 py-2 flex flex-col text-left justify-start items-start">
              <button v-for="data in filtered_datasheets" class="text-xs" :class="{
                'text-gray-400': !(selected_datasheet === data),
                'text-gray-200 font-bold': selected_datasheet === data
              }" @click="() => {
                selected_datasheet = data
                getData()
              }">
                <div>
                  {{ data }}
                  <span v-if="selected_datasheet === data">(Selected)</span>
                </div>
              </button>
            </div>
            <div class="px-4 py-2 border-t border-slate-600">
              <div>
                <input type="checkbox" v-model="options.onlyShowNewData" class="mr-2" />
                <label>Only Show New Data</label>
              </div>
              <div>
                <input type="checkbox" v-model="options.highlightNewData" class="mr-2" />
                <label>Highlight New Data</label>
              </div>
            </div>
          </div>
          <FilterBuilder :groups-filters="groups_filters" :fields="fields" @apply-filter="applyFilter" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css">
tbody {
  display: block;
  height: 70vh;
  overflow: auto;
}
thead, tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
  text-align: left;
}
</style>
