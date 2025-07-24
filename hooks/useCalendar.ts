'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  categoria: string;
  user_participando: boolean;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  eventCount: number;
  hasUserEvents: boolean;
}

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Buscar eventos do mês atual
  const fetchEventsForMonth = async (month: Date) => {
    setLoading(true);
    try {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const { data: eventsData, error } = await supabase
        .from('eventos')
        .select(`
          id,
          titulo,
          data,
          hora,
          categoria,
          participacoes(usuario_id)
        `)
        .gte('data', startOfMonth.toISOString().split('T')[0])
        .lte('data', endOfMonth.toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (error) throw error;

      const processedEvents: CalendarEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        titulo: event.titulo,
        data: event.data,
        hora: event.hora,
        categoria: event.categoria,
        user_participando: user ? event.participacoes?.some((p: any) => p.usuario_id === user.id) || false : false
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos do calendário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gerar dias do calendário
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Dias do mês anterior (para completar a primeira semana)
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      const dayEvents = events.filter(event => event.data === date.toISOString().split('T')[0]);
      
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: date.toDateString() === selectedDate.toDateString(),
        events: dayEvents,
        eventCount: dayEvents.length,
        hasUserEvents: dayEvents.some(event => event.user_participando)
      });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => event.data === date.toISOString().split('T')[0]);
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        events: dayEvents,
        eventCount: dayEvents.length,
        hasUserEvents: dayEvents.some(event => event.user_participando)
      });
    }
    
    // Dias do próximo mês (para completar a última semana)
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayEvents = events.filter(event => event.data === date.toISOString().split('T')[0]);
      
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: date.toDateString() === selectedDate.toDateString(),
        events: dayEvents,
        eventCount: dayEvents.length,
        hasUserEvents: dayEvents.some(event => event.user_participando)
      });
    }
    
    return days;
  };

  // Navegar entre meses
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Selecionar data
  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // Buscar eventos quando o mês muda
  useEffect(() => {
    fetchEventsForMonth(currentMonth);
  }, [currentMonth, user]);

  // Eventos da data selecionada
  const eventsForSelectedDate = events.filter(
    event => event.data === selectedDate.toISOString().split('T')[0]
  );

  return {
    selectedDate,
    currentMonth,
    events,
    loading,
    calendarDays: generateCalendarDays(),
    eventsForSelectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    refetch: () => fetchEventsForMonth(currentMonth)
  };
}