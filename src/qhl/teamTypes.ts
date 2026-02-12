export type QuizVenueOption = {
  quiz_venue_id: string;
  venue_id: string;
  venue_name: string;
  is_private: boolean;
  team_cap: number;
};

export type TeamRow = {
  id: string;
  quiz_id: string;
  quiz_venue_id: string;
  name: string;
  join_code: string;
  captain_user_id: string | null;
  is_active: boolean;
  created_at: string;
};
