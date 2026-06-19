CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audio_file_name VARCHAR(255) NOT NULL,
    transcription TEXT,
    filler_word_count INTEGER DEFAULT 0,
    filler_words JSONB DEFAULT '[]'::jsonb,
    confidence_score DOUBLE PRECISION DEFAULT 0,
    speech_pace_words_per_min DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at);
