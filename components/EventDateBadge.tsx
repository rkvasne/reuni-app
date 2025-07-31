interface EventDateBadgeProps {
  date: string
  className?: string
}

export default function EventDateBadge({ date, className = '' }: EventDateBadgeProps) {
  const formatDate = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const day = eventDate.getDate()
    const month = eventDate.toLocaleDateString('pt-BR', { month: 'short' })
    
    // Verificar se é hoje ou amanhã
    if (eventDate.toDateString() === today.toDateString()) {
      return { day: 'HOJE', month: '', isToday: true }
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return { day: 'AMANHÃ', month: '', isTomorrow: true }
    } else {
      return { day: day.toString(), month, isToday: false, isTomorrow: false }
    }
  }

  const dateInfo = formatDate(date)

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-lg p-2 text-center min-w-[50px] ${className}`}>
      <div className={`text-lg font-bold ${
        dateInfo.isToday ? 'text-green-600' : 
        dateInfo.isTomorrow ? 'text-orange-600' : 
        'text-primary-600'
      }`}>
        {dateInfo.day}
      </div>
      {dateInfo.month && (
        <div className="text-xs text-neutral-600 uppercase font-medium">
          {dateInfo.month}
        </div>
      )}
    </div>
  )
}