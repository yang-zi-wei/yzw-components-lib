<template>
  <v-card v-click-outside="handleClickOutside">
    <v-list density="compact">
      <v-list-item v-for="user in users" :key="user.id" :value="user" @click="onSelect(user)">{{
        user.userName
      }}</v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts" setup>
interface User {
  id: number
  userName: string
}

defineOptions({ name: 'AtUsersSelect' })

defineProps({
  handleClickOutside: {
    type: Function,
  },
})

const emit = defineEmits(['select'])

const users = [
  {
    userName: '成员A',
    id: 1,
  },
  {
    userName: '成员B',
    id: 2,
  },
  {
    userName: '成员C',
    id: 3,
  },
]

const onSelect = (user: User) => {
  emit('select', user)
}
</script>
