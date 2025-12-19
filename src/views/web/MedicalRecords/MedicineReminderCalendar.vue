<template>
<div class="medical-shell calendar-shell">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>

    <div class="glass-card header-card">
        <div class="page-header">
            <button class="icon-btn-ghost" @click="goBack">
                <mdicon name="arrow-left" :size="20" />
                <span>Back</span>
            </button>
            <div class="header-text">
                <p class="eyebrow">Medicine reminders</p>
                <h2 class="page-title">{{ weekLabel }}</h2>
                <p class="year-label">{{ calendarYear }}</p>
            </div>
            <div class="header-actions">
                <button class="icon-btn-ghost" @click="previousWeek">
                    <mdicon name="chevron-left" :size="18" />
                    <span>Previous</span>
                </button>
                <button class="icon-btn-ghost" @click="nextWeek">
                    <span>Next</span>
                    <mdicon name="chevron-right" :size="18" />
                </button>
                <button class="primary-btn" @click="navigateToAddReminder">
                    <mdicon name="plus" :size="18" />
                    Add reminder
                </button>
            </div>
        </div>

        <div class="calendar-strip card-section">
            <button
                v-for="day in weekDays"
                :key="day.iso"
                class="day-chip"
                :class="{ active: day.isSelected, today: day.isToday }"
                @click="selectDay(day.dateObj)"
            >
                <span class="day-name">{{ day.label }}</span>
                <span class="day-number">{{ day.date }}</span>
            </button>
        </div>
    </div>

    <div class="glass-card day-reminders">
        <div class="day-summary">
            <div>
                <p class="summary-label">Selected day</p>
                <h3 class="summary-date">{{ selectedDayLabel }}</h3>
            </div>
            <span v-if="selectedDayIsToday" class="tag">Today</span>
        </div>

        <div v-if="loading" class="day-empty">Loading reminders...</div>
        <div v-else-if="!dayReminders.length" class="day-empty">No reminders for this day.</div>
        <div v-else class="reminder-list">
            <div
                class="reminder-card card-section"
                v-for="reminder in dayReminders"
                :key="reminder.id"
            >
                <div class="reminder-header">
                    <div>
                        <h4 class="reminder-name">{{ reminder.medicineName }}</h4>
                        <p class="reminder-meta">{{ reminder.intakeMethod || 'Anytime' }}</p>
                    </div>
                    <span class="reminder-frequency">{{ formatFrequency(reminder) }}</span>
                </div>
                <div class="reminder-slots">
                    <button
                        class="slot-chip"
                        v-for="slot in reminder.slots"
                        :key="slot.id"
                        :class="{ checked: slot.status === 'taken' }"
                        @click="toggleReminder(reminder, slot, selectedDate)"
                    >
                        {{ slot.label }}
                        <span class="slot-status" v-if="slot.status">
                            {{ slot.status === 'taken' ? '☑︎' : '✖︎' }}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicineReminders } from '@/composables/medicineReminders'

export default {
    name: 'MedicineReminderCalendarWeb',
    setup() {
        const router = useRouter()
        const selectedDate = ref(new Date())
        const activeProfileId = ref(localStorage.getItem('selectedProfileId') || null)

        const {
            reminders,
            loading,
            fetchReminders,
            setReminderStatus
        } = useMedicineReminders()

        const navigateToAddReminder = () => {
            router.push('/medical-records/medicine-reminders/add')
        }

        const goBack = () => {
            router.back()
        }

        const weekStart = computed(() => {
            const start = new Date(selectedDate.value)
            start.setHours(0, 0, 0, 0)
            start.setDate(start.getDate() - start.getDay())
            return start
        })

        const weekLabel = computed(() => {
            const start = weekStart.value
            const end = new Date(start)
            end.setDate(start.getDate() + 6)
            const format = (date, withYear = false) => date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                ...(withYear ? { year: 'numeric' } : {})
            })
            return `${format(start, start.getFullYear() !== end.getFullYear())} – ${format(end, true)}`
        })

        const calendarYear = computed(() => selectedDate.value.getFullYear())

        const weekDays = computed(() => {
            const today = new Date()
            return Array.from({ length: 7 }).map((_, idx) => {
                const day = new Date(weekStart.value)
                day.setDate(weekStart.value.getDate() + idx)
                return {
                    label: day.toLocaleDateString(undefined, { weekday: 'short' }),
                    date: day.getDate(),
                    fullDate: day.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
                    isSelected: day.toDateString() === selectedDate.value.toDateString(),
                    isToday: day.toDateString() === today.toDateString(),
                    dateObj: day,
                    iso: day.toISOString()
                }
            })
        })

        const formatReminderTime = (timeString) => {
            if (!timeString) return '—'
            const [hour, minute] = timeString.split(':')
            const date = new Date()
            date.setHours(Number(hour), Number(minute), 0, 0)
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        }

        const formatFrequency = (reminder) => {
            if (reminder.slots && reminder.slots.length) {
                return `${reminder.slots.length}x`
            }
            const durationMatch = reminder.frequency?.match?.(/(\d+)/)
            if (durationMatch) {
                return `${durationMatch[1]}x`
            }
            return reminder.frequency || ''
        }

        const normalizeReminder = (reminder) => {
            const reminderSlots = reminder.slots && reminder.slots.length
                ? reminder.slots
                : [{ time: reminder.time, status: reminder.status }]
            const slots = reminderSlots
                .map((slot, index) => {
                    const rawTime = typeof slot === 'string' ? slot : slot.time
                    if (!rawTime) return null
                    return {
                        id: `${reminder.id}-${rawTime}-${index}`,
                        reminderId: reminder.id,
                        rawTime,
                        status: slot.status || null,
                        label: formatReminderTime(rawTime)
                    }
                })
                .filter(Boolean)
            return {
                ...reminder,
                slots
            }
        }

        const selectedDayLabel = computed(() => selectedDate.value.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }))

        const selectedDayIsToday = computed(() => selectedDate.value.toDateString() === new Date().toDateString())

        const dayReminders = computed(() => reminders.value.map(normalizeReminder))

        const loadSelectedDay = async() => {
            const token = localStorage.getItem('token')
            if (!token || !activeProfileId.value) {
                reminders.value = []
                return
            }
            await fetchReminders(token, activeProfileId.value, { date: selectedDate.value })
        }

        const selectDay = (dateObj) => {
            if (!dateObj) return
            selectedDate.value = new Date(dateObj)
            loadSelectedDay()
        }

        const previousWeek = () => {
            const updated = new Date(selectedDate.value)
            updated.setDate(updated.getDate() - 7)
            selectedDate.value = updated
            loadSelectedDay()
        }

        const nextWeek = () => {
            const updated = new Date(selectedDate.value)
            updated.setDate(updated.getDate() + 7)
            selectedDate.value = updated
            loadSelectedDay()
        }

        const applyStatusLocally = (reminderId, rawTime, newStatus) => {
            const statusValue = newStatus === 'pending' ? null : newStatus
            const target = reminders.value.find(r => r.id === reminderId)
            if (!target) return
            if (Array.isArray(target.slots) && target.slots.length) {
                const slot = target.slots.find(s => s.time === rawTime)
                if (slot) slot.status = statusValue
            } else if (target.time === rawTime) {
                target.status = statusValue
            }
        }

        const toggleReminder = async(reminder, reminderSlot, forDate) => {
            const token = localStorage.getItem('token')
            if (!token || !activeProfileId.value) return
            const newStatus = reminderSlot.status === 'taken' ? 'pending' : 'taken'
            try {
                await setReminderStatus(token, reminderSlot.reminderId, newStatus, forDate, reminderSlot.rawTime)
                applyStatusLocally(reminderSlot.reminderId, reminderSlot.rawTime, newStatus)
                reminderSlot.status = newStatus === 'pending' ? null : newStatus
            } catch (err) {
                console.error(err)
            }
        }

        onMounted(() => {
            loadSelectedDay()
        })

        return {
            weekDays,
            weekLabel,
            calendarYear,
            loading,
            goBack,
            previousWeek,
            nextWeek,
            selectDay,
            dayReminders,
            selectedDayLabel,
            selectedDayIsToday,
            toggleReminder,
            formatFrequency,
            selectedDate,
            navigateToAddReminder
        }
    }
}
</script>

<style scoped>
.calendar-shell {
  padding: 24px 16px 32px;
}

.header-card {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
  padding: 18px;
}

.page-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 12px;
}

.header-text {
  text-align: center;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}

.page-title {
  margin: 4px 0;
}

.year-label {
  margin: 0;
  color: var(--text-muted);
  font-weight: 600;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.calendar-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.day-chip {
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 12px 6px;
  text-align: center;
  box-shadow: var(--glass-card-shadow);
  transition: all 0.2s ease;
}

.day-chip.today {
  border-color: rgba(255, 255, 255, 0.35);
}

.day-chip.active {
  background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
  color: #0b1020;
  border-color: transparent;
}

.day-name {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.day-number {
  font-size: 16px;
  font-weight: 700;
}

.day-reminders {
  position: relative;
  z-index: 1;
  padding: 18px;
}

.day-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-label {
  margin: 0;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 12px;
}

.summary-date {
  margin: 4px 0 0;
  font-size: 20px;
  color: var(--text-primary);
}

.tag {
  background: linear-gradient(135deg, var(--accent-2), var(--accent-3));
  color: #0b1020;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  box-shadow: var(--glass-card-shadow);
}

.day-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 20px 8px;
  margin: 0;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card {
  border-radius: 14px;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 12px;
}

.reminder-name {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
}

.reminder-frequency {
  background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  color: #0b1020;
  padding: 6px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}

.reminder-meta {
  margin: 4px 0 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.reminder-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-chip {
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.slot-chip.checked {
  border-color: transparent;
  background: linear-gradient(135deg, #bbf7d0, #34d399);
  color: #0b1020;
}

.slot-status {
  font-size: 14px;
}

@media (max-width: 900px) {
  .page-header {
      grid-template-columns: 1fr;
      text-align: left;
  }

  .header-text {
      text-align: left;
  }

  .header-actions {
      justify-content: flex-start;
  }

  .calendar-strip {
      grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
