import { supabase } from './supabase';

export interface ReadingResult {
  id: string;
  category: string;
  cards: string[]; // Card IDs
  createdAt: Date;
}

export interface CreateReadingDto {
  category: string;
  cards: string[]; // Card IDs
  userId?: string;
}

export const apiClient = {
  /**
   * Save a new reading to Supabase
   */
  async saveReading(data: CreateReadingDto): Promise<ReadingResult> {
    const { data: reading, error } = await supabase
      .from('readings')
      .insert([
        {
          category: data.category,
          cards: data.cards,
          user_id: data.userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving reading:', error);
      throw error;
    }

    return {
      id: reading.id,
      category: reading.category,
      cards: reading.cards,
      createdAt: new Date(reading.created_at),
    };
  },

  /**
   * Get reading history (optionally filter by userId)
   */
  async getHistory(userId?: string): Promise<ReadingResult[]> {
    let query = supabase
      .from('readings')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: readings, error } = await query;

    if (error) {
      console.error('Error fetching history:', error);
      throw error;
    }

    return readings.map((r) => ({
      id: r.id,
      category: r.category,
      cards: r.cards,
      createdAt: new Date(r.created_at),
    }));
  },

  /**
   * Get a single reading by ID
   */
  async getReading(id: string): Promise<ReadingResult | null> {
    const { data: reading, error } = await supabase
      .from('readings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reading:', error);
      return null;
    }

    return {
      id: reading.id,
      category: reading.category,
      cards: reading.cards,
      createdAt: new Date(reading.created_at),
    };
  },
};
