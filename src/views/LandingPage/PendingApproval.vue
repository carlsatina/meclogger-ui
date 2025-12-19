<template>
  <div class="pending">
    <div class="card">
      <mdicon name="clock-alert" size="48" />
      <h2>Waiting for approval</h2>
      <p>Your account is pending admin approval. You’ll get access once your role is updated.</p>
      <button class="primary" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import store from '@/store'

const router = useRouter()
const logout = () => {
  store.methods.logoutUser()
  router.push('/login')
}
</script>

<style scoped>
.pending {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
  padding: 24px;
}
.card {
  background: #fff;
  padding: 28px;
  border-radius: 18px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
  display: grid;
  gap: 12px;
  color: #0f172a;
}
h2 {
  margin: 0;
  font-size: 22px;
}
p {
  margin: 0;
  color: #475569;
}
.primary {
  margin-top: 6px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #22c55e);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
</style>
