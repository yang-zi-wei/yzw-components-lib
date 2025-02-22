<template>
  <v-card v-click-outside="handleClickOutside">
    <v-list density="compact">
      <v-list-item v-for="user in users" :key="user.userId" :value="user" @click="onSelect(user)">{{
        user.userName
      }}</v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts" setup>
interface User {
  userId: number
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
    userId: 1,
  },
  {
    userName: '成员B',
    userId: 2,
  },
  {
    userName: '成员C',
    userId: 3,
  },
]

const onSelect = (user: User) => {
  emit('select', user)
}
</script>
