export interface Item {
  name: string
  location: string
  activity_name: string
  logo: string
  mitra_name: string
  id: string
  mitra_id: string
}

export interface GroupFilter {
  group_operation: 'or' | 'and'
  filters: {
    field: string
    operation: 'contains' | 'not_contains' | 'equal' | 'not_equal'
    value: string
  }[]
}
