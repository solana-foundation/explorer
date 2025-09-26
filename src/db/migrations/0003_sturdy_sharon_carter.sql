CREATE TABLE IF NOT EXISTS "quicknode_stream_cpi_program_calls" (
	"from_block_number" bigint NOT NULL,
	"to_block_number" bigint NOT NULL,
	"network" varchar(255) NOT NULL,
	"stream_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "t_pkey" PRIMARY KEY("network","from_block_number","to_block_number")
);

CREATE MATERIALIZED VIEW IF NOT EXISTS public.quicknode_stream_cpi_program_calls_mv AS
SELECT
	e->>'program_address'        AS program_address,
	e->>'caller_program_address' AS caller_program_address,
	COUNT(*)::bigint             AS calls_number
FROM public.quicknode_stream_cpi_program_calls t
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.data->'data','[]'::jsonb)) AS e
GROUP BY 1, 2
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS quicknode_stream_cpi_program_calls_mv_uq
    ON public.quicknode_stream_cpi_program_calls_mv (program_address, caller_program_address);

REFRESH MATERIALIZED VIEW public.quicknode_stream_cpi_program_calls_mv;
