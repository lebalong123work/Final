--
-- PostgreSQL database dump
--

\restrict JOP2oHB29dPfaAoL66VXGPJBnN56vyVHzCCWTDB7xJsjdXFSAq2PqdicgPldrSW

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: create_wallet_for_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_wallet_for_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO wallets(user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_wallet_for_user() OWNER TO postgres;

--
-- Name: set_default_role_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_default_role_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id FROM roles WHERE code = 'user';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_default_role_user() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: chapter_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chapter_comments (
    id bigint NOT NULL,
    chapter_type text NOT NULL,
    external_chapter_id text,
    self_chapter_id bigint,
    user_id bigint NOT NULL,
    parent_id bigint,
    text text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chapter_comments_chapter_type_check CHECK ((chapter_type = ANY (ARRAY['external'::text, 'self'::text]))),
    CONSTRAINT chapter_comments_check CHECK ((((chapter_type = 'external'::text) AND (external_chapter_id IS NOT NULL) AND (self_chapter_id IS NULL)) OR ((chapter_type = 'self'::text) AND (self_chapter_id IS NOT NULL) AND (external_chapter_id IS NULL))))
);


ALTER TABLE public.chapter_comments OWNER TO postgres;

--
-- Name: chapter_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chapter_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chapter_comments_id_seq OWNER TO postgres;

--
-- Name: chapter_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chapter_comments_id_seq OWNED BY public.chapter_comments.id;


--
-- Name: chapter_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chapter_reactions (
    id bigint NOT NULL,
    chapter_id text NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    comic_id bigint,
    comic_type text,
    slug text,
    chap_api text,
    chapter_title text,
    CONSTRAINT chk_reaction_comic_type CHECK ((comic_type = ANY (ARRAY['external'::text, 'self'::text])))
);


ALTER TABLE public.chapter_reactions OWNER TO postgres;

--
-- Name: chapter_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chapter_reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chapter_reactions_id_seq OWNER TO postgres;

--
-- Name: chapter_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chapter_reactions_id_seq OWNED BY public.chapter_reactions.id;


--
-- Name: comic_purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comic_purchases (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    comic_type text NOT NULL,
    external_comic_id bigint,
    self_comic_id bigint,
    comic_slug text,
    comic_api_id text,
    price bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT comic_purchases_check CHECK ((((comic_type = 'external'::text) AND (external_comic_id IS NOT NULL) AND (self_comic_id IS NULL)) OR ((comic_type = 'self'::text) AND (self_comic_id IS NOT NULL) AND (external_comic_id IS NULL)))),
    CONSTRAINT comic_purchases_comic_type_check CHECK ((comic_type = ANY (ARRAY['external'::text, 'self'::text])))
);


ALTER TABLE public.comic_purchases OWNER TO postgres;

--
-- Name: comic_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comic_purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comic_purchases_id_seq OWNER TO postgres;

--
-- Name: comic_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comic_purchases_id_seq OWNED BY public.comic_purchases.id;


--
-- Name: comic_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comic_ratings (
    id bigint NOT NULL,
    comic_type character varying(20) NOT NULL,
    comic_id bigint NOT NULL,
    user_id bigint NOT NULL,
    rating integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT comic_ratings_comic_type_check CHECK (((comic_type)::text = ANY ((ARRAY['external'::character varying, 'self'::character varying])::text[]))),
    CONSTRAINT comic_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.comic_ratings OWNER TO postgres;

--
-- Name: comic_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comic_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comic_ratings_id_seq OWNER TO postgres;

--
-- Name: comic_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comic_ratings_id_seq OWNED BY public.comic_ratings.id;


--
-- Name: external_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_categories (
    id bigint NOT NULL,
    api_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100)
);


ALTER TABLE public.external_categories OWNER TO postgres;

--
-- Name: external_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.external_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.external_categories_id_seq OWNER TO postgres;

--
-- Name: external_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.external_categories_id_seq OWNED BY public.external_categories.id;


--
-- Name: external_comic_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_comic_categories (
    comic_id bigint NOT NULL,
    category_id bigint NOT NULL
);


ALTER TABLE public.external_comic_categories OWNER TO postgres;

--
-- Name: external_comics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_comics (
    id bigint NOT NULL,
    api_id character varying(50) NOT NULL,
    name text NOT NULL,
    slug text,
    origin_name text,
    status character varying(20),
    thumb_url text,
    sub_docquyen boolean DEFAULT false,
    is_paid boolean DEFAULT false,
    price bigint DEFAULT 0,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    owner_user_id bigint,
    translator text,
    CONSTRAINT external_comics_price_check CHECK ((price >= 0))
);


ALTER TABLE public.external_comics OWNER TO postgres;

--
-- Name: external_comics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.external_comics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.external_comics_id_seq OWNER TO postgres;

--
-- Name: external_comics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.external_comics_id_seq OWNED BY public.external_comics.id;


--
-- Name: external_latest_chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_latest_chapters (
    comic_id bigint NOT NULL,
    chapter_name character varying(50),
    chapter_api_data text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.external_latest_chapters OWNER TO postgres;

--
-- Name: levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.levels (
    id integer NOT NULL,
    level_no integer NOT NULL,
    min_total_topup bigint DEFAULT 0 NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.levels OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.levels_id_seq OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.levels_id_seq OWNED BY public.levels.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    actor_user_id bigint,
    type character varying(50) NOT NULL,
    title text NOT NULL,
    body text,
    url text,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: self_comic_chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.self_comic_chapters (
    id bigint NOT NULL,
    comic_id bigint NOT NULL,
    chapter_no integer NOT NULL,
    chapter_title character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.self_comic_chapters OWNER TO postgres;

--
-- Name: self_comic_chapters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.self_comic_chapters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.self_comic_chapters_id_seq OWNER TO postgres;

--
-- Name: self_comic_chapters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.self_comic_chapters_id_seq OWNED BY public.self_comic_chapters.id;


--
-- Name: self_comics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.self_comics (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    cover_image text,
    description text,
    total_chapters integer DEFAULT 1 NOT NULL,
    status smallint DEFAULT 1,
    category_id integer,
    is_paid boolean DEFAULT false NOT NULL,
    price bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    author character varying(255),
    translated_by character varying(255),
    CONSTRAINT ck_self_comics_price CHECK ((price >= 0)),
    CONSTRAINT ck_self_comics_status CHECK ((status = ANY (ARRAY[0, 1]))),
    CONSTRAINT ck_self_comics_total_chapters CHECK ((total_chapters >= 1))
);


ALTER TABLE public.self_comics OWNER TO postgres;

--
-- Name: self_comics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.self_comics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.self_comics_id_seq OWNER TO postgres;

--
-- Name: self_comics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.self_comics_id_seq OWNED BY public.self_comics.id;


--
-- Name: site_traffic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_traffic (
    id bigint NOT NULL,
    path text NOT NULL,
    session_id text NOT NULL,
    visit_key text NOT NULL,
    user_id bigint,
    ip_address text,
    user_agent text,
    referer text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_traffic OWNER TO postgres;

--
-- Name: site_traffic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_traffic_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_traffic_id_seq OWNER TO postgres;

--
-- Name: site_traffic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_traffic_id_seq OWNED BY public.site_traffic.id;


--
-- Name: user_chapter_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_chapter_reads (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    comic_type text NOT NULL,
    external_chapter_id text,
    self_chapter_id bigint,
    external_comic_id bigint,
    self_comic_id bigint,
    read_at timestamp without time zone DEFAULT now(),
    external_chapter_api text,
    external_chapter_title text,
    CONSTRAINT user_chapter_reads_check CHECK ((((comic_type = 'external'::text) AND (external_chapter_id IS NOT NULL) AND (external_comic_id IS NOT NULL) AND (self_chapter_id IS NULL) AND (self_comic_id IS NULL)) OR ((comic_type = 'self'::text) AND (self_chapter_id IS NOT NULL) AND (self_comic_id IS NOT NULL) AND (external_chapter_id IS NULL) AND (external_comic_id IS NULL)))),
    CONSTRAINT user_chapter_reads_comic_type_check CHECK ((comic_type = ANY (ARRAY['external'::text, 'self'::text])))
);


ALTER TABLE public.user_chapter_reads OWNER TO postgres;

--
-- Name: user_chapter_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_chapter_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_chapter_reads_id_seq OWNER TO postgres;

--
-- Name: user_chapter_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_chapter_reads_id_seq OWNED BY public.user_chapter_reads.id;


--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    followee_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT user_follows_check CHECK ((follower_id <> followee_id))
);


ALTER TABLE public.user_follows OWNER TO postgres;

--
-- Name: user_follows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_follows_id_seq OWNER TO postgres;

--
-- Name: user_follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_follows_id_seq OWNED BY public.user_follows.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(50),
    email character varying(255),
    phone character varying(20),
    provider character varying(20) DEFAULT 'local'::character varying NOT NULL,
    google_id character varying(100),
    password_hash text,
    role_id integer DEFAULT 1 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_transactions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(20) NOT NULL,
    amount bigint NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    order_id text,
    trans_id bigint,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.wallet_transactions OWNER TO postgres;

--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallet_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallet_transactions_id_seq OWNER TO postgres;

--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    user_id bigint NOT NULL,
    balance bigint DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: chapter_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_comments ALTER COLUMN id SET DEFAULT nextval('public.chapter_comments_id_seq'::regclass);


--
-- Name: chapter_reactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_reactions ALTER COLUMN id SET DEFAULT nextval('public.chapter_reactions_id_seq'::regclass);


--
-- Name: comic_purchases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases ALTER COLUMN id SET DEFAULT nextval('public.comic_purchases_id_seq'::regclass);


--
-- Name: comic_ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings ALTER COLUMN id SET DEFAULT nextval('public.comic_ratings_id_seq'::regclass);


--
-- Name: external_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_categories ALTER COLUMN id SET DEFAULT nextval('public.external_categories_id_seq'::regclass);


--
-- Name: external_comics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comics ALTER COLUMN id SET DEFAULT nextval('public.external_comics_id_seq'::regclass);


--
-- Name: levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels ALTER COLUMN id SET DEFAULT nextval('public.levels_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: self_comic_chapters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comic_chapters ALTER COLUMN id SET DEFAULT nextval('public.self_comic_chapters_id_seq'::regclass);


--
-- Name: self_comics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comics ALTER COLUMN id SET DEFAULT nextval('public.self_comics_id_seq'::regclass);


--
-- Name: site_traffic id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_traffic ALTER COLUMN id SET DEFAULT nextval('public.site_traffic_id_seq'::regclass);


--
-- Name: user_chapter_reads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads ALTER COLUMN id SET DEFAULT nextval('public.user_chapter_reads_id_seq'::regclass);


--
-- Name: user_follows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows ALTER COLUMN id SET DEFAULT nextval('public.user_follows_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallet_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, created_at) FROM stdin;
3	DOREMON	2026-03-06 08:57:48.648305
4	Pikachu	2026-03-13 22:30:25.445465
\.


--
-- Data for Name: chapter_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapter_comments (id, chapter_type, external_chapter_id, self_chapter_id, user_id, parent_id, text, created_at) FROM stdin;
2	self	\N	2	16	\N	hhh	2026-03-09 11:08:20.198931
\.


--
-- Data for Name: chapter_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapter_reactions (id, chapter_id, user_id, created_at, comic_id, comic_type, slug, chap_api, chapter_title) FROM stdin;
21	659396e3e120ddf21993b681	1	2026-03-12 15:36:48.387276	1	external	yeu-than-ky	https://sv1.otruyencdn.com/v1/api/chapter/659396e3e120ddf21993b681	1
22	2	1	2026-03-12 15:40:59.101207	1	self	\N	\N	\N
\.


--
-- Data for Name: comic_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_purchases (id, user_id, comic_type, external_comic_id, self_comic_id, comic_slug, comic_api_id, price, created_at) FROM stdin;
1	16	external	221	\N	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu	69256445679e2c7ab9378e7b	7999	2026-03-09 09:26:03.312177
2	16	external	266	\N	yuusha-gakuen-no-fukushuusei	69a6a80d679e2c7ab98ca565	88888	2026-03-09 09:44:52.668774
3	1	self	\N	1	\N	\N	9999	2026-03-09 10:26:23.031857
4	1	external	266	\N	yuusha-gakuen-no-fukushuusei	69a6a80d679e2c7ab98ca565	88888	2026-03-09 10:27:46.616056
5	1	external	1	\N	yeu-than-ky	659380a910dc9c0a7e2e5d5a	1000	2026-03-12 14:46:25.542023
\.


--
-- Data for Name: comic_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_ratings (id, comic_type, comic_id, user_id, rating, created_at, updated_at) FROM stdin;
7	external	268	16	4	2026-03-09 09:43:38.290329	2026-03-09 09:43:38.290329
1	self	1	16	5	2026-03-08 23:21:58.75057	2026-03-09 09:44:21.458839
9	external	11	16	3	2026-03-09 12:43:12.137964	2026-03-09 12:43:12.137964
10	external	218	1	5	2026-03-09 12:59:13.375573	2026-03-09 12:59:34.514995
28	external	266	1	4	2026-03-09 21:01:28.134933	2026-03-09 21:01:28.134933
29	external	268	1	5	2026-03-10 09:48:40.294036	2026-03-10 09:48:40.294036
30	external	335	1	3	2026-03-10 10:09:16.315428	2026-03-10 10:09:16.315428
31	external	2	1	4	2026-03-11 09:35:05.224431	2026-03-11 09:35:05.987701
3	self	1	1	5	2026-03-08 23:30:15.211928	2026-03-11 09:38:19.896756
34	external	317	1	5	2026-03-11 20:28:35.186284	2026-03-11 20:28:35.186284
35	external	1	1	4	2026-03-12 15:02:56.388046	2026-03-12 15:03:36.676633
39	self	1	17	4	2026-03-14 10:46:19.57852	2026-03-14 10:46:19.57852
\.


--
-- Data for Name: external_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_categories (id, api_id, name, slug) FROM stdin;
21	6508654905d5791ad671a4d6	Manga	manga
33	6508654905d5791ad671a4ec	School Life	school-life
242	6508654a05d5791ad671a4fa	Slice of Life	slice-of-life
42	6508654905d5791ad671a4e2	Mystery	mystery
652	6508654905d5791ad671a4b5	Cooking	cooking
703	6508654905d5791ad671a4cc	Harem	harem
64	6508654a05d5791ad671a504	Supernatural	supernatural
426	6508654a05d5791ad671a514	Webtoon	webtoon
28	6508654905d5791ad671a4f2	Shoujo	shoujo
406	6508654a05d5791ad671a516	Xuyên Không	xuyen-khong
14	6508654905d5791ad671a4ac	Chuyển Sinh	chuyen-sinh
50	6508654905d5791ad671a4e0	Mecha	mecha
4	6508654905d5791ad671a4f6	Shounen	shounen
55	6508654905d5791ad671a4a6	Adventure	adventure
211	6508654905d5791ad671a4dc	Martial Arts	martial-arts
20	6508654905d5791ad671a4be	Drama	drama
2	6508654905d5791ad671a4c7	Fantasy	fantasy
678	6508654905d5791ad671a4ca	Gender Bender	gender-bender
241	6508654905d5791ad671a4f0	Seinen	seinen
65	6508654a05d5791ad671a50a	Tragedy	tragedy
204	6508654905d5791ad671a4d0	Horror	horror
3	6508654905d5791ad671a4d8	Manhua	manhua
19	6508654905d5791ad671a4af	Comedy	comedy
228	6508654905d5791ad671a4ce	Historical	historical
17	6508654905d5791ad671a4ea	Romance	romance
1	6508654905d5791ad671a491	Action	action
56	6508654905d5791ad671a4b8	Cổ Đại	co-dai
15	6508654905d5791ad671a4da	Manhwa	manhwa
16	6508654905d5791ad671a4e4	Ngôn Tình	ngon-tinh
5	6508654a05d5791ad671a510	Truyện Màu	truyen-mau
\.


--
-- Data for Name: external_comic_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_comic_categories (comic_id, category_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
2	1
3	1
4	1
5	1
6	1
7	1
8	1
9	1
10	14
10	15
10	16
10	17
10	5
11	19
11	20
11	21
11	16
11	17
11	4
12	19
12	2
12	17
12	28
12	15
12	5
13	3
13	16
13	33
13	5
14	1
15	3
15	16
15	5
16	1
17	1
18	3
18	42
18	5
19	1
19	15
19	5
20	1
20	14
20	3
20	50
20	4
20	5
21	1
22	1
22	55
22	56
22	2
22	3
22	5
23	1
24	19
24	20
24	21
24	64
24	65
218	1
218	55
220	204
220	3
220	42
221	1
222	1
223	1
223	3
223	42
223	5
224	1
225	1
226	1
226	15
226	5
227	1
228	3
228	33
228	64
228	5
228	406
229	1
229	55
229	3
229	211
229	5
230	1
231	1
232	1
233	1
234	1
235	1
236	1
237	1
238	1
238	55
238	2
238	3
238	64
238	5
238	426
239	1
240	1
241	1
266	1
268	1
269	1
271	1
272	1
273	1
274	1
275	1
276	1
277	1
278	1
278	15
278	5
279	1
280	1
281	1
282	1
283	1
284	1
285	1
286	1
287	1
288	1
289	1
316	14
316	56
316	15
316	16
316	5
317	1
317	15
317	211
317	5
318	1
321	1
322	1
322	14
322	3
322	42
322	5
322	406
323	204
323	3
323	42
324	1
325	1
326	1
327	19
327	652
327	2
327	21
328	1
329	1
331	1
332	1
333	1
334	1
335	19
335	21
335	17
335	33
335	241
335	242
338	1
338	55
338	2
338	678
338	241
340	1
341	15
341	16
341	5
342	19
342	21
342	17
342	33
342	242
344	1
344	14
344	3
344	42
344	5
344	406
345	1
346	1
346	56
346	2
346	703
346	3
346	211
346	5
346	406
350	14
350	56
350	3
350	16
350	17
352	1
352	228
352	15
352	4
352	5
353	3
353	211
353	5
354	19
354	20
354	2
354	678
354	3
354	17
354	5
355	19
355	228
355	15
355	16
355	17
355	5
356	1
356	15
356	5
357	1
358	1
359	1
361	56
361	15
361	16
361	5
\.


--
-- Data for Name: external_comics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_comics (id, api_id, name, slug, origin_name, status, thumb_url, sub_docquyen, is_paid, price, updated_at, created_at, owner_user_id, translator) FROM stdin;
3	69290329679e2c7ab93dafa4	Wizard's Soul ~Koi No Seisen~	wizards-soul-koi-no-seisen	Wizard's Soul ~koi No Seisen~	ongoing	wizards-soul-koi-no-seisen-thumb.jpg	f	f	0	2026-03-05 12:51:52.076	2026-02-22 15:11:10.655112	\N	\N
4	69410b2d0a67720d2312af82	Vừa Vô Địch Tại Mạt Thế Đã Bị Chặn Cửa Cầu Hôn	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon		ongoing	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon-thumb.jpg	f	f	0	2026-02-14 16:22:59.535	2026-02-22 15:11:10.655112	\N	\N
6	67d650c0a4a4a602fb8d30d3	Vật Giá Sụt Giảm, Triệu Phú Quay Về	vat-gia-sut-giam-trieu-phu-quay-ve	Vật Giá Sụt Giảm | Triệu Phú Quay Về	ongoing	vat-gia-sut-giam-trieu-phu-quay-ve-thumb.jpg	f	f	0	2026-02-14 16:22:41.417	2026-02-22 15:11:10.655112	\N	\N
7	68d7831554ddf1823a6b8425	Tu Tiên Thần Tốc	tu-tien-than-toc	Tu Tiên Thần Tốc	ongoing	tu-tien-than-toc-thumb.jpg	f	f	0	2026-02-14 16:22:32.285	2026-02-22 15:11:10.655112	\N	\N
8	68f46d34911ae532d4cfe064	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	ongoing	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no-thumb.jpg	f	f	0	2026-02-14 16:22:22.33	2026-02-22 15:11:10.655112	\N	\N
5	693f8d540a67720d23124b3a	Vô Địch Chỉ Với 1 Máu	vo-dich-chi-voi-1-mau		ongoing	vo-dich-chi-voi-1-mau-thumb.jpg	f	f	0	2026-03-09 09:58:56.676	2026-02-22 15:11:10.655112	\N	\N
1	659380a910dc9c0a7e2e5d5a	Yêu Thần Ký	yeu-than-ky	Tales of Demons And Gods	ongoing	yeu-than-ky-thumb.jpg	f	t	1000	2026-03-10 20:58:40.015862	2026-02-22 15:11:10.655112	\N	Minh khải
220	6598f51668e54cf5b50a31be	Vô Địch Bị Động Tạo Ra Tấn Sát Thương	vo-dich-bi-dong-tao-ra-tan-sat-thuong		ongoing	vo-dich-bi-dong-tao-ra-tan-sat-thuong-thumb.jpg	f	f	0	2026-03-14 11:57:42.671	2026-02-25 21:29:31.815549	16	\N
9	672da13d80217a7ba9bdc03d	Trụ Vương Tái Sinh Không Muốn Làm Đại Phản Diện	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien		ongoing	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien-thumb.jpg	f	f	0	2026-03-14 11:56:20.539	2026-02-22 15:11:10.655112	\N	\N
10	658cf3c310dc9c0a7e2e3ae0	Trở Thành Cô Vợ Khế Ước Của Nhân Vật Phản Diện	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien	Trở thành gia đình của nhân vật phản diện | Khế Ước Trở Thành Gia Đình Với Ác Ma	ongoing	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien-thumb.jpg	f	f	0	2026-02-14 16:22:07.091	2026-02-22 15:11:10.655112	\N	\N
224	67516df8a4a4a602fb797880	Tuyệt Đối Dân Cư	tuyet-doi-dan-cu	Tuyệt Đối Dân Cư	ongoing	tuyet-doi-dan-cu-thumb.jpg	f	f	0	2026-03-14 11:56:44.15	2026-02-25 21:29:31.815549	16	\N
12	6647947323b29ddd02834fb6	Tôi Thề Chúng Ta Chỉ Là Bạn	toi-the-chung-ta-chi-la-ban		ongoing	toi-the-chung-ta-chi-la-ban-thumb.jpg	f	f	0	2026-02-14 16:21:52.715	2026-02-22 15:11:10.655112	\N	\N
13	6591202d10dc9c0a7e2e54fc	Tôi Mộng Giữa Ban Ngày	toi-mong-giua-ban-ngay	Ban Ngày Mơ Thấy Em	ongoing	toi-mong-giua-ban-ngay-thumb.jpg	f	f	0	2026-02-14 16:21:45.622	2026-02-22 15:11:10.655112	\N	\N
14	689714b754ddf1823a633346	Tôi Dùng Hệ Thống Đỉnh Cấp Tái Tạo Thế Giới	toi-dung-he-thong-dinh-cap-tai-tao-the-gioi	Tôi Dùng Hệ Thống Đỉnh Cấp Tái Tạo Thế Giới	ongoing	toi-dung-he-thong-dinh-cap-tai-tao-the-gioi-thumb.jpg	f	f	0	2026-02-14 16:21:39.54	2026-02-22 15:11:10.655112	\N	\N
15	65b1fef3fad3f557c4ead9a2	Tôi Cũng Muốn Làm Mợ Út	toi-cung-muon-lam-mo-ut		ongoing	toi-cung-muon-lam-mo-ut-thumb.jpg	f	f	0	2026-02-14 16:21:30.181	2026-02-22 15:11:10.655112	\N	\N
16	697f228b679e2c7ab97066d1	Tôi Chuyển Sinh Thành Em Gái Chủ Mưu Trò Chơi Sinh Tử, Và Thất Bại Thảm Hại	toi-chuyen-sinh-thanh-em-gai-chu-muu-tro-choi-sinh-tu-va-that-bai-tham-hai	Tôi Chuyển Sinh Thành Em Gái Chủ Mưu Trò Chơi Sinh Tử | Và Thất Bại Thảm Hại	ongoing	toi-chuyen-sinh-thanh-em-gai-chu-muu-tro-choi-sinh-tu-va-that-bai-tham-hai-thumb.jpg	f	f	0	2026-02-14 16:21:23.592	2026-02-22 15:11:10.655112	\N	\N
17	68384b6154ddf1823a4e45a3	Toàn Chức Kiếm Tu	toan-chuc-kiem-tu	Toàn Chức Kiếm Tu	ongoing	toan-chuc-kiem-tu-thumb.jpg	f	f	0	2026-02-14 16:21:15.258	2026-02-22 15:11:10.655112	\N	\N
18	6584ff8a10dc9c0a7e2e0985	Tinh Võ Thần Quyết	tinh-vo-than-quyet		ongoing	tinh-vo-than-quyet-thumb.jpg	f	f	0	2026-02-14 16:21:09.436	2026-02-22 15:11:10.655112	\N	\N
19	6598f44468e54cf5b50a2eb7	Tinh Tú Kiếm Sĩ	tinh-tu-kiem-si	Yểm Vân Kiếm Thánh	ongoing	tinh-tu-kiem-si-thumb.jpg	f	f	0	2026-02-14 16:21:02.185	2026-02-22 15:11:10.655112	\N	\N
20	658f7d5410dc9c0a7e2e4cbb	Tinh Giáp Hồn Tướng	tinh-giap-hon-tuong	Huyền Thoại Tinh Giáp	ongoing	tinh-giap-hon-tuong-thumb.jpg	f	f	0	2026-02-14 16:20:55.821	2026-02-22 15:11:10.655112	\N	\N
21	68ef67e7911ae532d4ced4dd	Tiên Vương Thú Liệp Pháp Tắc	tien-vuong-thu-liep-phap-tac	Tiên Vương Thú Liệp Pháp Tắc	ongoing	tien-vuong-thu-liep-phap-tac-thumb.jpg	f	f	0	2026-02-14 16:20:49.881	2026-02-22 15:11:10.655112	\N	\N
22	659121cc10dc9c0a7e2e578c	Tiên Võ Đế Tôn	tien-vo-de-ton		ongoing	tien-vo-de-ton-thumb.jpg	f	f	0	2026-02-14 16:20:43.829	2026-02-22 15:11:10.655112	\N	\N
23	670ba48580217a7ba9b8674e	Thuần Thú Sư Thiên Tài	thuan-thu-su-thien-tai		ongoing	thuan-thu-su-thien-tai-thumb.jpg	f	f	0	2026-02-14 16:20:37.227	2026-02-22 15:11:10.655112	\N	\N
24	6598f56e68e54cf5b50a32ee	Thiếu Chủ Giỏi Chạy Trốn	thieu-chu-gioi-chay-tron	Waka là Nige jouzu no wakagimi | The Elusive Samurai | The Elusive Young Lord	ongoing	thieu-chu-gioi-chay-tron-thumb.jpg	f	f	0	2026-02-14 16:20:30.659	2026-02-22 15:11:10.655112	\N	\N
218	65680cf710dc9c0a7e2d5af8	Yugo - Kẻ thương thuyết	yugo-ke-thuong-thuyet	Yugo Kẻ thương thuyết | Những Ngày Xanh | 勇午 | 勇午 パキスタン編 | 勇午 日本編 | Yugo Negotiator | Yugo the Negotiator | Yuugo	ongoing	yugo-ke-thuong-thuyet-thumb.jpg	f	f	0	2026-02-25 10:07:25.548	2026-02-25 21:29:31.815549	16	\N
222	68d8e2c454ddf1823a6bd12c	Vĩ Nhân Kiếm	vi-nhan-kiem	Vĩ Nhân Kiếm	ongoing	vi-nhan-kiem-thumb.jpg	f	f	0	2026-02-25 10:06:46.003	2026-02-25 21:29:31.815549	16	\N
223	659121e968e54cf5b5091426	Vạn Cổ Tối Cường Tông	van-co-toi-cuong-tong		ongoing	van-co-toi-cuong-tong-thumb.jpg	f	f	0	2026-02-25 10:06:38.916	2026-02-25 21:29:31.815549	16	\N
225	6874ffa654ddf1823a5e81bd	Tôi Trở Thành Em Vợ Út Của Các Nam Chính Trong Tiểu Thuyết Harem Ngược U Ám	toi-tro-thanh-em-vo-ut-cua-cac-nam-chinh-trong-tieu-thuyet-harem-nguoc-u-am	Tôi Trở Thành Em Vợ Út Của Các Nam Chính Trong Tiểu Thuyết Harem Ngược U Ám	ongoing	toi-tro-thanh-em-vo-ut-cua-cac-nam-chinh-trong-tieu-thuyet-harem-nguoc-u-am-thumb.jpg	f	f	0	2026-02-25 10:06:26.14	2026-02-25 21:29:31.815549	16	\N
226	658cf42510dc9c0a7e2e3b53	Tôi Mạnh Hơn Anh Hùng	toi-manh-hon-anh-hung		ongoing	toi-manh-hon-anh-hung-thumb.jpg	f	f	0	2026-02-25 10:06:19.158	2026-02-25 21:29:31.815549	16	\N
227	692902ea0a67720d23090486	Tôi Là Nông Dân Trồng Vong Linh	toi-la-nong-dan-trong-vong-linh		ongoing	toi-la-nong-dan-trong-vong-linh-thumb.jpg	f	f	0	2026-02-25 10:06:09.693	2026-02-25 21:29:31.815549	16	\N
228	65bded1066b83f0711f381fe	Toàn Dân Chuyển Chức Ngự Long Sư Là Chức Nghiệp Yếu Nhất	toan-dan-chuyen-chuc-ngu-long-su-la-chuc-nghiep-yeu-nhat		ongoing	toan-dan-chuyen-chuc-ngu-long-su-la-chuc-nghiep-yeu-nhat-thumb.jpg	f	f	0	2026-02-25 10:06:03.737	2026-02-25 21:29:31.815549	16	\N
229	658e77ca68e54cf5b508ff73	Toàn Cầu Cao Võ	toan-cau-cao-vo		coming_soon	toan-cau-cao-vo-thumb.jpg	f	f	0	2026-02-25 10:05:56.017	2026-02-25 21:29:31.815549	16	\N
230	69842c110a67720d2340684b	Tinh Tế Bằng Không	tinh-te-bang-khong	Tinh Tế Bằng Không	ongoing	tinh-te-bang-khong-thumb.jpg	f	f	0	2026-02-25 10:05:49.414	2026-02-25 21:29:31.815549	16	\N
231	693395a8679e2c7ab94297c2	Thương Hoàng Trở Về	thuong-hoang-tro-ve		ongoing	thuong-hoang-tro-ve-thumb.jpg	f	f	0	2026-02-25 10:05:42.306	2026-02-25 21:29:31.815549	16	\N
232	68d8e2eb911ae532d4c9ecf4	Thức Tỉnh Toàn Chức	thuc-tinh-toan-chuc	Thức Tỉnh Toàn Chức | Toàn Năng Giác Tỉnh Sư	ongoing	thuc-tinh-toan-chuc-thumb.jpg	f	f	0	2026-02-25 10:05:36.266	2026-02-25 21:29:31.815549	16	\N
233	682f0072911ae532d4aa8b8d	Thuần Hóa Munchkin	thuan-hoa-munchkin	Thuần Hóa Munchkin	ongoing	thuan-hoa-munchkin-thumb.jpg	f	f	0	2026-02-25 10:05:29.772	2026-02-25 21:29:31.815549	16	\N
2	694cb4b40a67720d23170965	Xuyên Không Tới Tu Tiên Giới Làm Trù Thần	xuyen-khong-toi-tu-tien-gioi-lam-tru-than	Xuyên Không Tới Tu Tiên Giới Làm Trù Thần	ongoing	xuyen-khong-toi-tu-tien-gioi-lam-tru-than-thumb.jpg	f	f	0	2026-03-09 09:59:28.923	2026-02-22 15:11:10.655112	\N	\N
221	69256445679e2c7ab9378e7b	Võ Đại Lang Mạnh Nhất Tái Sinh Ở Thế Giới Thủy Hử	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu		ongoing	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu-thumb.jpg	f	t	7999	2026-03-09 09:58:47.469	2026-02-25 21:29:31.815549	16	\N
234	6897154a911ae532d4c1653d	Thiếu Nợ Quá Nhiều, Ta Bị Ép Trở Thành Người Làm Công Của Tà Thần	thieu-no-qua-nhieu-ta-bi-ep-tro-thanh-nguoi-lam-cong-cua-ta-than	Thiếu Nợ Quá Nhiều | Ta Bị Ép Trở Thành Người Làm Công Của Tà Thần	ongoing	thieu-no-qua-nhieu-ta-bi-ep-tro-thanh-nguoi-lam-cong-cua-ta-than-thumb.jpg	f	f	0	2026-02-25 10:05:20.017	2026-02-25 21:29:31.815549	16	\N
235	67f9f96cbd508bf388809fef	Thiên Tài Nhìn Thấu Thế Giới	thien-tai-nhin-thau-the-gioi	Thiên Tài Nhìn Thấu Thế Giới	ongoing	thien-tai-nhin-thau-the-gioi-thumb.jpg	f	f	0	2026-02-25 10:05:11.087	2026-02-25 21:29:31.815549	16	\N
236	66f3cd52b84a01eaefe714fb	Thiên Ma 3077	thien-ma-3077		ongoing	thien-ma-3077-thumb.jpg	f	f	0	2026-02-25 10:05:04.232	2026-02-25 21:29:31.815549	16	\N
237	6950a2fa679e2c7ab94fc3d9	Thiên Hạ Ai Không Biết Quân	thien-ha-ai-khong-biet-quan	Thiên Hạ Ai Không Biết Quân	ongoing	thien-ha-ai-khong-biet-quan-thumb.jpg	f	f	0	2026-02-25 10:04:57.951	2026-02-25 21:29:31.815549	16	\N
238	659382a168e54cf5b5091e0b	Thảm Họa Tử Linh Sư	tham-hoa-tu-linh-su	Tử Linh Pháp Sư: Ta Chính Là Thiên Tai	ongoing	tham-hoa-tu-linh-su-thumb.jpg	f	f	0	2026-02-25 10:04:51.777	2026-02-25 21:29:31.815549	16	\N
239	688ef62f54ddf1823a61ecfb	Thái Cổ Thập Hung: Người Khác Ngự Thú Ta Ngự Thú Nương	thai-co-thap-hung-nguoi-khac-ngu-thu-ta-ngu-thu-nuong	Thái Cổ Thập Hung: Người Khác Ngự Thú Ta Ngự Thú Nương	ongoing	thai-co-thap-hung-nguoi-khac-ngu-thu-ta-ngu-thu-nuong-thumb.jpg	f	f	0	2026-02-25 10:04:44.14	2026-02-25 21:29:31.815549	16	\N
240	6913fe5954ddf1823a7d7609	Thà Lấy Bài Vị Còn Hơn Làm Thiếp	tha-lay-bai-vi-con-hon-lam-thiep	Thà Lấy Bài Vị Còn Hơn Làm Thiếp	ongoing	tha-lay-bai-vi-con-hon-lam-thiep-thumb.jpg	f	f	0	2026-02-25 10:04:32.936	2026-02-25 21:29:31.815549	16	\N
241	691bfee8911ae532d4de5dc1	Thà Gả Cho Người Đã Khuất Còn Hơn Làm Vợ Lẽ	tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le	Thà Gả Cho Người Đã Khuất Còn Hơn Làm Vợ Lẽ	ongoing	tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le-thumb.jpg	f	f	0	2026-02-25 10:04:26.719	2026-02-25 21:29:31.815549	16	\N
268	666ed4b017c5971e56de270c	Xem Phim	xem-phim-nguoi-lon-duoc-khong	R15+ Ja Dame Desuka?	ongoing	xem-phim-nguoi-lon-duoc-khong-thumb.jpg	f	f	0	2026-03-05 12:52:17.512	2026-03-06 08:41:36.654866	16	\N
331	6975ed090a67720d232f9e8d	Trở Thành Người Trong Gia Đình Công Tước Đứng Sau Mọi Chuyện	tro-thanh-nguoi-trong-gia-dinh-cong-tuoc-dung-sau-moi-chuyen	Trở Thành Người Trong Gia Đình Công Tước Đứng Sau Mọi Chuyện	ongoing	tro-thanh-nguoi-trong-gia-dinh-cong-tuoc-dung-sau-moi-chuyen-thumb.jpg	f	f	0	2026-03-09 09:57:31.426	2026-03-10 10:03:12.82608	16	\N
332	69a6a3f30a67720d2357eff9	Trở Thành Đại Hoàng Tử: Huyền Thoại Kiếm Ca	tro-thanh-dai-hoang-tu-huyen-thoai-kiem-ca		coming_soon	tro-thanh-dai-hoang-tu-huyen-thoai-kiem-ca-thumb.jpg	f	f	0	2026-03-09 09:57:24.626	2026-03-10 10:03:12.82608	16	\N
333	676b97fda4a4a602fb7d9a52	Trở Thành Anh Hùng Mạnh Nhất Nhờ Gian Lận	tro-thanh-anh-hung-manh-nhat-nho-gian-lan	Trở Thành Anh Hùng Mạnh Nhất Nhờ Gian Lận	ongoing	tro-thanh-anh-hung-manh-nhat-nho-gian-lan-thumb.jpg	f	f	0	2026-03-09 09:57:18.096	2026-03-10 10:03:12.82608	16	\N
334	68e49076911ae532d4cd3586	Trả Thù Trong Bất Chính	tra-thu-trong-bat-chinh		ongoing	tra-thu-trong-bat-chinh-thumb.jpg	f	f	0	2026-03-09 09:57:12.086	2026-03-10 10:03:12.82608	16	\N
335	6571281c68e54cf5b5083cf3	Tonari No Furi-san Ga Tonikaku Kowai	tonari-no-furi-san-ga-tonikaku-kowai	Yankee Bàn Bên	ongoing	tonari-no-furi-san-ga-tonikaku-kowai-thumb.jpg	f	f	0	2026-03-09 09:57:05.883	2026-03-10 10:03:12.82608	16	\N
11	658e76bc68e54cf5b508fcb0	Tóm Lại Là Em Dễ Thương Được Chưa ?	tom-lai-la-em-de-thuong-duoc-chua		coming_soon	tom-lai-la-em-de-thuong-duoc-chua-thumb.jpg	f	f	0	2026-03-09 09:57:00.223	2026-02-22 15:11:10.655112	\N	\N
329	69533ae00a67720d231c4651	Tsubasa - Giấc Mơ Sân Cỏ	tsubasa-giac-mo-san-co	Tsubasa | Giấc Mơ Sân Cỏ	ongoing	tsubasa-giac-mo-san-co-thumb.jpg	f	f	0	2026-03-14 11:56:32.204	2026-03-10 10:03:12.82608	16	\N
275	69842b840a67720d23406721	Tôi Trở Thành Người Được Nữ Phản Diện Yêu Thích Nhất	toi-tro-thanh-nguoi-duoc-nu-phan-dien-yeu-thich-nhat	Tôi Trở Thành Người Được Nữ Phản Diện Yêu Thích Nhất	ongoing	toi-tro-thanh-nguoi-duoc-nu-phan-dien-yeu-thich-nhat-thumb.jpg	f	f	0	2026-03-14 11:55:13.627	2026-03-06 08:41:36.654866	16	\N
269	69a6a6e20a67720d2357f4d6	Xách Mèo Vào Ở	xach-meo-vao-o		coming_soon	xach-meo-vao-o-thumb.jpg	f	f	0	2026-03-05 12:51:57.726	2026-03-06 08:41:36.654866	16	\N
271	691fe3530a67720d2301d445	Vùng Đất Sương Mù	vung-dat-suong-mu	Vùng Đất Sương Mù	ongoing	vung-dat-suong-mu-thumb.jpg	f	f	0	2026-03-05 12:51:46.299	2026-03-06 08:41:36.654866	16	\N
272	696643f2679e2c7ab9588a79	Ví Dụ Thất Bại Của Lời Nguyền Hoàn Hảo	vi-du-that-bai-cua-loi-nguyen-hoan-hao		ongoing	vi-du-that-bai-cua-loi-nguyen-hoan-hao-thumb.jpg	f	f	0	2026-03-05 12:51:38.752	2026-03-06 08:41:36.654866	16	\N
273	694cb689679e2c7ab94bbc96	Từ Những Người Khốn Khổ - Gửi Đến Những Người Bạn Của Khoảnh Khắc L'heure Bleue.	tu-nhung-nguoi-khon-kho-gui-den-nhung-nguoi-ban-cua-khoanh-khac-lheure-bleue	Từ Những Người Khốn Khổ | Gửi Đến Những Người Bạn Của Khoảnh Khắc L'heure Bleue.	ongoing	tu-nhung-nguoi-khon-kho-gui-den-nhung-nguoi-ban-cua-khoanh-khac-lheure-bleue-thumb.jpg	f	f	0	2026-03-05 12:51:31.358	2026-03-06 08:41:36.654866	16	\N
274	6825b403911ae532d4a865e9	Trở Thành Vô Địch Bằng Hệ Thống Giảm Giá Trị	tro-thanh-vo-dich-bang-he-thong-giam-gia-tri	Trở Thành Vô Địch Bằng Hệ Thống Giảm Giá Trị	ongoing	tro-thanh-vo-dich-bang-he-thong-giam-gia-tri-thumb.jpg	f	f	0	2026-03-05 12:51:22.37	2026-03-06 08:41:36.654866	16	\N
276	68da303d911ae532d4ca3e8e	Tôi Sống Cuộc Đời Chữa Lành Ở Kiếp Thứ Hai	toi-song-cuoc-doi-chua-lanh-o-kiep-thu-hai		ongoing	toi-song-cuoc-doi-chua-lanh-o-kiep-thu-hai-thumb.jpg	f	f	0	2026-03-05 12:51:07.211	2026-03-06 08:41:36.654866	16	\N
277	69426765679e2c7ab947c2a6	Tôi Đã Sẵn Sàng Cho Cuộc Ly Hôn	toi-da-san-sang-cho-cuoc-ly-hon	Tôi Đã Sẵn Sàng Cho Cuộc Ly Hôn	ongoing	toi-da-san-sang-cho-cuoc-ly-hon-thumb.jpg	f	f	0	2026-03-05 12:51:01.409	2026-03-06 08:41:36.654866	16	\N
278	6598f67568e54cf5b50a36a3	Tôi Đã Giết Tuyển Thủ Học Viện	toi-da-giet-tuyen-thu-hoc-vien		ongoing	toi-da-giet-tuyen-thu-hoc-vien-thumb.jpg	f	f	0	2026-03-05 12:50:55.413	2026-03-06 08:41:36.654866	16	\N
279	693e3dfa679e2c7ab9468388	Tôi Cứ Ngỡ Rằng Mình Là Nhân Vật Chính	toi-cu-ngo-rang-minh-la-nhan-vat-chinh	Tôi Cứ Ngỡ Rằng Mình Là Nhân Vật Chính	ongoing	toi-cu-ngo-rang-minh-la-nhan-vat-chinh-thumb.jpg	f	f	0	2026-03-05 12:50:49.332	2026-03-06 08:41:36.654866	16	\N
280	69a6a6e8679e2c7ab98ca391	Tôi Có Thể Nhìn Thấy Tiêu Đề	toi-co-the-nhin-thay-tieu-de		coming_soon	toi-co-the-nhin-thay-tieu-de-thumb.jpg	f	f	0	2026-03-05 12:50:43.246	2026-03-06 08:41:36.654866	16	\N
281	69a6a7d30a67720d2357f61f	Tôi Chỉ Muốn Một Cái Kết Hạnh Phúc	toi-chi-muon-mot-cai-ket-hanh-phuc		coming_soon	toi-chi-muon-mot-cai-ket-hanh-phuc-thumb.jpg	f	f	0	2026-03-05 12:50:37.215	2026-03-06 08:41:36.654866	16	\N
282	67f9f94f33fa3efa41c19ba6	Tố Hồi Xuân Thời	to-hoi-xuan-thoi	Tố Hồi Xuân Thời	ongoing	to-hoi-xuan-thoi-thumb.jpg	f	f	0	2026-03-05 12:50:30.679	2026-03-06 08:41:36.654866	16	\N
283	697b086d0a67720d233740b6	Tổ Chức Học Viện	to-chuc-hoc-vien		ongoing	to-chuc-hoc-vien-thumb.jpg	f	f	0	2026-03-05 12:50:25.691	2026-03-06 08:41:36.654866	16	\N
284	69a6a4ef679e2c7ab98ca048	Tình Yêu Và Nàng Tiên Cá	tinh-yeu-va-nang-tien-ca	Tình Yêu Và Nàng Tiên Cá	coming_soon	tinh-yeu-va-nang-tien-ca-thumb.jpg	f	f	0	2026-03-05 12:50:20.015	2026-03-06 08:41:36.654866	16	\N
285	68b5489f911ae532d4c53794	Tình Yêu Muộn Màng	tinh-yeu-muon-mang	Tình Yêu Muộn Màng	ongoing	tinh-yeu-muon-mang-thumb.jpg	f	f	0	2026-03-05 12:50:14.052	2026-03-06 08:41:36.654866	16	\N
286	68afc47b54ddf1823a660f42	Tiểu Thư Phản Diện Bj	tieu-thu-phan-dien-bj	Tiểu Thư Phản Diện Bj	ongoing	tieu-thu-phan-dien-bj-thumb.jpg	f	f	0	2026-03-05 12:50:08.329	2026-03-06 08:41:36.654866	16	\N
287	69a44aef0a67720d235676a8	Tiểu Thư Nhỏ Vô Năng Muốn Cứu Rỗi Gia Tộc	tieu-thu-nho-vo-nang-muon-cuu-roi-gia-toc	Tiểu Thư Nhỏ Vô Năng Muốn Cứu Rỗi Gia Tộc	coming_soon	tieu-thu-nho-vo-nang-muon-cuu-roi-gia-toc-thumb.jpg	f	f	0	2026-03-05 12:50:02.529	2026-03-06 08:41:36.654866	16	\N
288	690d5baf54ddf1823a781d46	Tiên Tử, Hãy Nghe Ta Giải Thích	tien-tu-hay-nghe-ta-giai-thich		ongoing	tien-tu-hay-nghe-ta-giai-thich-thumb.jpg	f	f	0	2026-03-05 12:49:55.088	2026-03-06 08:41:36.654866	16	\N
289	68d7835054ddf1823a6b8473	Tiến Hóa Vô Hạn Bắt Đầu Từ Con Số Không	tien-hoa-vo-han-bat-dau-tu-con-so-khong	Tiến Hóa Vô Hạn Bắt Đầu Từ Con Số Không	ongoing	tien-hoa-vo-han-bat-dau-tu-con-so-khong-thumb.jpg	f	f	0	2026-03-05 12:49:43.726	2026-03-06 08:41:36.654866	16	\N
266	69a6a80d679e2c7ab98ca565	Yuusha Gakuen No Fukushuusei	yuusha-gakuen-no-fukushuusei	勇者学園の復讐生	coming_soon	yuusha-gakuen-no-fukushuusei-thumb.jpg	f	t	88888	2026-03-05 12:52:28.913	2026-03-06 08:41:36.654866	16	\N
316	6580fc9768e54cf5b508a713	Vương Miện Viridescent	vuong-mien-viridescent	Vương Miện Lục Bảo | Vương Miện Ngọc Bích	ongoing	vuong-mien-viridescent-thumb.jpg	f	f	0	2026-03-09 09:59:22.24	2026-03-10 10:03:12.82608	16	\N
317	6584ff6968e54cf5b508c52f	Vua Võ Đài	vua-vo-dai		ongoing	vua-vo-dai-thumb.jpg	f	f	0	2026-03-09 09:59:14.054	2026-03-10 10:03:12.82608	16	\N
318	680b8353911ae532d4a11558	Võng Du: Afk Trăm Vạn Năm, Ta Thức Tỉnh Thành Thần	vong-du-afk-tram-van-nam-ta-thuc-tinh-thanh-than	Võng Du: Afk Trăm Vạn Năm | Ta Thức Tỉnh Thành Thần | Treo Máy Trăm Vạn Năm Ta Tỉnh Lại Thành Thần	ongoing	vong-du-afk-tram-van-nam-ta-thuc-tinh-thanh-than-thumb.jpg	f	f	0	2026-03-09 09:59:05.013	2026-03-10 10:03:12.82608	16	\N
321	666fbca68fb9d537e97aeb4f	Vị Vua Mạnh Nhất Đã Trở Lại	vi-vua-manh-nhat-da-tro-lai		ongoing	vi-vua-manh-nhat-da-tro-lai-thumb.jpg	f	f	0	2026-03-09 09:58:40.206	2026-03-10 10:03:12.82608	16	\N
322	658f7caa10dc9c0a7e2e4ba9	Vạn Cổ Chí Tôn	van-co-chi-ton		ongoing	van-co-chi-ton-thumb.jpg	f	f	0	2026-03-09 09:58:34.063	2026-03-10 10:03:12.82608	16	\N
323	657e5b5c10dc9c0a7e2ddd27	U Minh Ngụy tượng	u-minh-nguy-tuong		ongoing	u-minh-nguy-tuong-thumb.jpg	f	f	0	2026-03-09 09:58:28.425	2026-03-10 10:03:12.82608	16	\N
325	66f3cd5b80217a7ba9b4eead	Tuyệt Thế Hồi Quy	tuyet-the-hoi-quy		ongoing	tuyet-the-hoi-quy-thumb.jpg	f	f	0	2026-03-09 09:58:17.26	2026-03-10 10:03:12.82608	16	\N
327	658a458b10dc9c0a7e2e2d28	Tsuihousha Shokudou E Youkoso!	tsuihousha-shokudou-e-youkoso	Welcome To Cheap Restaurant Of Outcast!	ongoing	tsuihousha-shokudou-e-youkoso-thumb.jpg	f	f	0	2026-03-09 09:58:02.963	2026-03-10 10:03:12.82608	16	\N
328	68ef67dd54ddf1823a70bcdc	Tsuiho Sareta Ossan Tanya Shi, Naze Ka Densetsu No Daimeiko Ni Naru	tsuiho-sareta-ossan-tanya-shi-naze-ka-densetsu-no-daimeiko-ni-naru		ongoing	tsuiho-sareta-ossan-tanya-shi-naze-ka-densetsu-no-daimeiko-ni-naru-thumb.jpg	f	f	0	2026-03-09 09:57:57.647	2026-03-10 10:03:12.82608	16	\N
338	6593825168e54cf5b5091d7d	Yakuza Reincarnation	yakuza-reincarnation	Yakuza chuyển sinh	ongoing	yakuza-reincarnation-thumb.jpg	f	f	0	2026-03-14 11:57:48.446	2026-03-14 12:37:01.878906	1	\N
324	69a7e2c10a67720d2358d7f6	Tỷ Phú Ở Rể	ty-phu-o-re	Tỷ Phú Ở Rể	coming_soon	ty-phu-o-re-thumb.jpg	f	f	0	2026-03-14 11:57:12.978	2026-03-10 10:03:12.82608	16	\N
340	682f136f911ae532d4aacdbe	Vạn Tộc Xâm Lược: Bắt Đầu Thuần Hóa Cự Thú Cấp Sử Thi	van-toc-xam-luoc-bat-dau-thuan-hoa-cu-thu-cap-su-thi	Vạn Tộc Xâm Lược: Bắt Đầu Thuần Hóa Cự Thú Cấp Sử Thi	ongoing	van-toc-xam-luoc-bat-dau-thuan-hoa-cu-thu-cap-su-thi-thumb.jpg	f	f	0	2026-03-14 11:57:32.131	2026-03-14 12:37:01.878906	1	\N
341	658f7dda10dc9c0a7e2e4d94	Vận May Không Ngờ	van-may-khong-ngo	Vận May Bất Ngờ	ongoing	van-may-khong-ngo-thumb.jpg	f	f	0	2026-03-14 11:57:24.572	2026-03-14 12:37:01.878906	1	\N
342	6598f35768e54cf5b50a2b43	Ushiro no Seki no Gyaru ni Sukarete Shimatta	ushiro-no-seki-no-gyaru-ni-sukarete-shimatta	Ushiro no Seki no Gal ni Sukarete Shimatta. Mou Ore wa Dame Kamo Shirenai. | The gal is sitting behind me | and loves me.	ongoing	ushiro-no-seki-no-gyaru-ni-sukarete-shimatta-thumb.jpg	f	f	0	2026-03-14 11:57:18.873	2026-03-14 12:37:01.878906	1	\N
344	659381d910dc9c0a7e2e5f80	Tuyệt Thế Võ Thần	tuyet-the-vo-than		ongoing	tuyet-the-vo-than-thumb.jpg	f	f	0	2026-03-14 11:57:06.545	2026-03-14 12:37:01.878906	1	\N
345	68f30dd9911ae532d4cf896f	Tuyệt Thế Đường Môn	tuyet-the-duong-mon	Tuyệt Thế Đường Môn | Tuyệt thế Đường Môn | Đấu La Đại Lục 2	ongoing	tuyet-the-duong-mon-thumb.jpg	f	f	0	2026-03-14 11:56:57.353	2026-03-14 12:37:01.878906	1	\N
346	658b8ffe10dc9c0a7e2e32a0	Tuyệt Sắc Đạo Lữ Đều Nói Ngô Hoàng Thể Chất Vô Địch	tuyet-sac-dao-lu-deu-noi-ngo-hoang-the-chat-vo-dich	Tuyệt Thế Đạo Lữ | Đạo Lữ Tuyệt Sắc Đều Nói Ngô Hoàng Thể Chất Vô Địch	ongoing	tuyet-sac-dao-lu-deu-noi-ngo-hoang-the-chat-vo-dich-thumb.jpg	f	f	0	2026-03-14 11:56:51.36	2026-03-14 12:37:01.878906	1	\N
326	6906caa9911ae532d4d4793f	Tung Tiền Hữu Tọa Linh Kiếm Sơn	tung-tien-huu-toa-linh-kiem-son	Trước Kia Có Tòa Linh Kiếm Sơn	ongoing	tung-tien-huu-toa-linh-kiem-son-thumb.jpg	f	f	0	2026-03-14 11:56:37.993	2026-03-10 10:03:12.82608	16	\N
350	656d45af68e54cf5b5082b67	Trùng Sinh Chuyên Sủng Độc Phi Của Nhiếp Chính Vương	trung-sinh-chuyen-sung-doc-phi-cua-nhiep-chinh-vuong		ongoing	trung-sinh-chuyen-sung-doc-phi-cua-nhiep-chinh-vuong-thumb.jpg	f	f	0	2026-03-14 11:56:26.547	2026-03-14 12:37:01.878906	1	\N
352	658f7d1468e54cf5b50907f5	Trọng Sinh Thành Thần Y Thời Tam Quốc	trong-sinh-thanh-than-y-thoi-tam-quoc	I Reincarnated As A Legendary Surgeon	ongoing	trong-sinh-thanh-than-y-thoi-tam-quoc-thumb.jpg	f	f	0	2026-03-14 11:56:14.772	2026-03-14 12:37:01.878906	1	\N
353	658e77ac10dc9c0a7e2e443d	Trọng Sinh Đô Thị Tu Tiên	trong-sinh-do-thi-tu-tien		coming_soon	trong-sinh-do-thi-tu-tien-thumb.jpg	f	f	0	2026-03-14 11:56:08.881	2026-03-14 12:37:01.878906	1	\N
354	6598f4ea10dc9c0a7e2f75b4	Trời sinh mị cốt ta bị đồ nhi yandere để mắt tới	troi-sinh-mi-cot-ta-bi-do-nhi-yandere-de-mat-toi		ongoing	troi-sinh-mi-cot-ta-bi-do-nhi-yandere-de-mat-toi-thumb.jpg	f	f	0	2026-03-14 11:56:00.562	2026-03-14 12:37:01.878906	1	\N
355	6598f63910dc9c0a7e2f7a72	Trở Thành Người Giám Định Chất Độc Cho Thế Lực Hắc Ám	tro-thanh-nguoi-giam-dinh-chat-doc-cho-the-luc-hac-am		ongoing	tro-thanh-nguoi-giam-dinh-chat-doc-cho-the-luc-hac-am-thumb.jpg	f	f	0	2026-03-14 11:55:47.224	2026-03-14 12:37:01.878906	1	\N
356	658cf28d68e54cf5b508f4c5	Trở Thành Hung Thần Trong Trò Chơi Thủ Thành	tro-thanh-hung-than-trong-tro-choi-thu-thanh		ongoing	tro-thanh-hung-than-trong-tro-choi-thu-thanh-thumb.jpg	f	f	0	2026-03-14 11:55:41.064	2026-03-14 12:37:01.878906	1	\N
357	6954a340679e2c7ab9518e19	Trả Lại Gấp Vạn, Sư Tỷ Xin Hãy Tự Trọng	tra-lai-gap-van-su-ty-xin-hay-tu-trong		ongoing	tra-lai-gap-van-su-ty-xin-hay-tu-trong-thumb.jpg	f	f	0	2026-03-14 11:55:34.218	2026-03-14 12:37:01.878906	1	\N
358	676b986da4a4a602fb7d9a93	Tonari No Seki No Yatsu Ga Souiu Me De Mitekuru	tonari-no-seki-no-yatsu-ga-souiu-me-de-mitekuru	Tonari No Seki No Yatsu Ga Souiu Me De Mitekuru	ongoing	tonari-no-seki-no-yatsu-ga-souiu-me-de-mitekuru-thumb.jpg	f	f	0	2026-03-14 11:55:25.418	2026-03-14 12:37:01.878906	1	\N
359	68d64e52911ae532d4c94e93	Tôi Và Cô Bạn Gái Không Chắc Là Con Người Của Tôi	toi-va-co-ban-gai-khong-chac-la-con-nguoi-cua-toi	Tôi Và Cô Bạn Gái Không Chắc Là Con Người Của Tôi	ongoing	toi-va-co-ban-gai-khong-chac-la-con-nguoi-cua-toi-thumb.jpg	f	f	0	2026-03-14 11:55:19.822	2026-03-14 12:37:01.878906	1	\N
361	6588f6ec68e54cf5b508db7f	Tôi Trở Thành Mẹ Của Chiến Binh	toi-tro-thanh-me-cua-chien-binh	Tôi trở thành mẹ của vị anh hùng chiến binh	ongoing	toi-tro-thanh-me-cua-chien-binh-thumb.jpg	f	f	0	2026-03-14 11:55:07.809	2026-03-14 12:37:01.878906	1	\N
\.


--
-- Data for Name: external_latest_chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_latest_chapters (comic_id, chapter_name, chapter_api_data, updated_at) FROM stdin;
218	73	https://sv1.otruyencdn.com/v1/api/chapter/699e6720e0d753f32e588909	2026-02-25 21:31:37.72871
4	20	https://sv1.otruyencdn.com/v1/api/chapter/69903dece0d753f32e5870af	2026-02-22 15:16:31.617459
6	74	https://sv1.otruyencdn.com/v1/api/chapter/69903deae0d753f32e5870a9	2026-02-22 15:16:31.617459
7	58	https://sv1.otruyencdn.com/v1/api/chapter/69903de9e0d753f32e5870a0	2026-02-22 15:16:31.617459
8	43	https://sv1.otruyencdn.com/v1/api/chapter/69903de97b89b5b2570daf74	2026-02-22 15:16:31.617459
10	153	https://sv1.otruyencdn.com/v1/api/chapter/69903de5e0d753f32e587095	2026-02-22 15:16:31.617459
12	63	https://sv1.otruyencdn.com/v1/api/chapter/69903de57b89b5b2570daf6e	2026-02-22 15:16:31.617459
13	131	https://sv1.otruyencdn.com/v1/api/chapter/69903de2e0d753f32e587085	2026-02-22 15:16:31.617459
14	41	https://sv1.otruyencdn.com/v1/api/chapter/69903de07b89b5b2570daf68	2026-02-22 15:16:31.617459
15	82	https://sv1.otruyencdn.com/v1/api/chapter/69903ddde0d753f32e58707e	2026-02-22 15:16:31.617459
16	12	https://sv1.otruyencdn.com/v1/api/chapter/69903dd97b89b5b2570daf5f	2026-02-22 15:16:31.617459
17	91	https://sv1.otruyencdn.com/v1/api/chapter/69903dd77b89b5b2570daf5a	2026-02-22 15:16:31.617459
18	936	https://sv1.otruyencdn.com/v1/api/chapter/69903db4e0d753f32e58706b	2026-02-22 15:16:31.617459
19	109	https://sv1.otruyencdn.com/v1/api/chapter/69903db4e0d753f32e587068	2026-02-22 15:16:31.617459
20	345	https://sv1.otruyencdn.com/v1/api/chapter/69903db3e0d753f32e587060	2026-02-22 15:16:31.617459
21	34	https://sv1.otruyencdn.com/v1/api/chapter/69903daee0d753f32e58705a	2026-02-22 15:16:31.617459
22	881	https://sv1.otruyencdn.com/v1/api/chapter/69903dad7b89b5b2570daf3f	2026-02-22 15:16:31.617459
23	65	https://sv1.otruyencdn.com/v1/api/chapter/69903dace0d753f32e587053	2026-02-22 15:16:31.617459
24	164	https://sv1.otruyencdn.com/v1/api/chapter/69903da5e0d753f32e58704b	2026-02-22 15:16:31.617459
222	36	https://sv1.otruyencdn.com/v1/api/chapter/699e6698e0d753f32e588866	2026-02-25 21:31:37.72871
223	499	https://sv1.otruyencdn.com/v1/api/chapter/699e66907b89b5b2570dcb1b	2026-02-25 21:31:37.72871
225	55	https://sv1.otruyencdn.com/v1/api/chapter/699e666d7b89b5b2570dcafe	2026-02-25 21:31:37.72871
226	109	https://sv1.otruyencdn.com/v1/api/chapter/699e66377b89b5b2570dcadf	2026-02-25 21:31:37.72871
227	16	https://sv1.otruyencdn.com/v1/api/chapter/699e661a7b89b5b2570dcab8	2026-02-25 21:31:37.72871
228	216	https://sv1.otruyencdn.com/v1/api/chapter/699e6623e0d753f32e588848	2026-02-25 21:31:37.72871
229	352	https://sv1.otruyencdn.com/v1/api/chapter/699e65e9e0d753f32e58880e	2026-02-25 21:31:37.72871
230	28	https://sv1.otruyencdn.com/v1/api/chapter/699e65d4e0d753f32e588800	2026-02-25 21:31:37.72871
231	34	https://sv1.otruyencdn.com/v1/api/chapter/699e65abe0d753f32e5887c8	2026-02-25 21:31:37.72871
232	98	https://sv1.otruyencdn.com/v1/api/chapter/699e6592e0d753f32e5887af	2026-02-25 21:31:37.72871
233	42	https://sv1.otruyencdn.com/v1/api/chapter/699e658e7b89b5b2570dca46	2026-02-25 21:31:37.72871
234	37	https://sv1.otruyencdn.com/v1/api/chapter/699e658ae0d753f32e58879f	2026-02-25 21:31:37.72871
235	50	https://sv1.otruyencdn.com/v1/api/chapter/699e6589e0d753f32e58879b	2026-02-25 21:31:37.72871
236	77	https://sv1.otruyencdn.com/v1/api/chapter/699e6581e0d753f32e588791	2026-02-25 21:31:37.72871
237	16	https://sv1.otruyencdn.com/v1/api/chapter/699e657de0d753f32e58878b	2026-02-25 21:31:37.72871
238	254	https://sv1.otruyencdn.com/v1/api/chapter/699e6567e0d753f32e58877c	2026-02-25 21:31:37.72871
239	127	https://sv1.otruyencdn.com/v1/api/chapter/699e655be0d753f32e58876a	2026-02-25 21:31:37.72871
3	9	https://sv1.otruyencdn.com/v1/api/chapter/69a7b0e07b89b5b2570dfdcf	2026-03-06 22:05:41.58629
1	671	https://sv1.otruyencdn.com/v1/api/chapter/69ae29717b89b5b2570e0d9a	2026-03-10 10:03:12.82608
2	67	https://sv1.otruyencdn.com/v1/api/chapter/69ae296e7b89b5b2570e0d92	2026-03-10 10:03:12.82608
5	14	https://sv1.otruyencdn.com/v1/api/chapter/69ae29267b89b5b2570e0d8a	2026-03-10 10:03:12.82608
221	36	https://sv1.otruyencdn.com/v1/api/chapter/69ae2924e0d753f32e58c9e8	2026-03-10 10:03:12.82608
11	339	https://sv1.otruyencdn.com/v1/api/chapter/69ae2872e0d753f32e58c915	2026-03-10 10:03:12.82608
220	156	https://sv1.otruyencdn.com/v1/api/chapter/69b4e31e7b89b5b2570e2180	2026-03-14 12:37:01.878906
224	71	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2ffe0d753f32e58de99	2026-03-14 12:37:01.878906
9	202	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2b57b89b5b2570e2139	2026-03-14 12:37:01.878906
240	33	https://sv1.otruyencdn.com/v1/api/chapter/699e65457b89b5b2570dca31	2026-02-25 21:31:37.72871
241	33	https://sv1.otruyencdn.com/v1/api/chapter/699e6503e0d753f32e58874a	2026-02-25 21:31:37.72871
266	25	https://sv1.otruyencdn.com/v1/api/chapter/69a90b1de0d753f32e58bcdc	2026-03-06 22:05:41.58629
268	33	https://sv1.otruyencdn.com/v1/api/chapter/69a90a64e0d753f32e58bc8e	2026-03-06 22:05:41.58629
269	2	https://sv1.otruyencdn.com/v1/api/chapter/69a909e5e0d753f32e58bc1a	2026-03-06 22:05:41.58629
271	26	https://sv1.otruyencdn.com/v1/api/chapter/69a909d5e0d753f32e58bbf2	2026-03-06 22:05:41.58629
272	20	https://sv1.otruyencdn.com/v1/api/chapter/69a909c97b89b5b2570e0556	2026-03-06 22:05:41.58629
273	8	https://sv1.otruyencdn.com/v1/api/chapter/69a7b0bb7b89b5b2570dfd7d	2026-03-06 22:05:41.58629
274	76	https://sv1.otruyencdn.com/v1/api/chapter/69a9099ee0d753f32e58bbc4	2026-03-06 22:05:41.58629
338	50.2	https://sv1.otruyencdn.com/v1/api/chapter/69b4e3277b89b5b2570e218e	2026-03-14 12:37:01.878906
276	90	https://sv1.otruyencdn.com/v1/api/chapter/69a90994e0d753f32e58bbb8	2026-03-06 22:05:41.58629
277	49	https://sv1.otruyencdn.com/v1/api/chapter/69a90991e0d753f32e58bbb2	2026-03-06 22:05:41.58629
278	114	https://sv1.otruyencdn.com/v1/api/chapter/69a90978e0d753f32e58bba6	2026-03-06 22:05:41.58629
279	13	https://sv1.otruyencdn.com/v1/api/chapter/69a90973e0d753f32e58bba0	2026-03-06 22:05:41.58629
280	2	https://sv1.otruyencdn.com/v1/api/chapter/69a909527b89b5b2570e0550	2026-03-06 22:05:41.58629
281	1	https://sv1.otruyencdn.com/v1/api/chapter/69a9093c7b89b5b2570e0548	2026-03-06 22:05:41.58629
282	66	https://sv1.otruyencdn.com/v1/api/chapter/69a909367b89b5b2570e0542	2026-03-06 22:05:41.58629
283	9	https://sv1.otruyencdn.com/v1/api/chapter/69a909237b89b5b2570e0539	2026-03-06 22:05:41.58629
284	3	https://sv1.otruyencdn.com/v1/api/chapter/69a9091a7b89b5b2570e0527	2026-03-06 22:05:41.58629
285	33	https://sv1.otruyencdn.com/v1/api/chapter/69a909107b89b5b2570e051b	2026-03-06 22:05:41.58629
286	45	https://sv1.otruyencdn.com/v1/api/chapter/69a90901e0d753f32e58bb93	2026-03-06 22:05:41.58629
287	2	https://sv1.otruyencdn.com/v1/api/chapter/69a90900e0d753f32e58bb90	2026-03-06 22:05:41.58629
288	40	https://sv1.otruyencdn.com/v1/api/chapter/69a908f0e0d753f32e58bb85	2026-03-06 22:05:41.58629
289	67	https://sv1.otruyencdn.com/v1/api/chapter/69a908f07b89b5b2570e0514	2026-03-06 22:05:41.58629
316	131	https://sv1.otruyencdn.com/v1/api/chapter/69ae2974e0d753f32e58ca15	2026-03-10 10:03:12.82608
317	184	https://sv1.otruyencdn.com/v1/api/chapter/69ae2974e0d753f32e58ca11	2026-03-10 10:03:12.82608
318	67	https://sv1.otruyencdn.com/v1/api/chapter/69ae2931e0d753f32e58c9ef	2026-03-10 10:03:12.82608
321	166	https://sv1.otruyencdn.com/v1/api/chapter/69ae29217b89b5b2570e0d84	2026-03-10 10:03:12.82608
322	508	https://sv1.otruyencdn.com/v1/api/chapter/69ae291ce0d753f32e58c9e2	2026-03-10 10:03:12.82608
323	508	https://sv1.otruyencdn.com/v1/api/chapter/69ae29117b89b5b2570e0d7e	2026-03-10 10:03:12.82608
325	91	https://sv1.otruyencdn.com/v1/api/chapter/69ae28fb7b89b5b2570e0d5d	2026-03-10 10:03:12.82608
327	51	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f27b89b5b2570e0d57	2026-03-10 10:03:12.82608
328	8.3	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f1e0d753f32e58c99c	2026-03-10 10:03:12.82608
331	10	https://sv1.otruyencdn.com/v1/api/chapter/69ae28d27b89b5b2570e0d0c	2026-03-10 10:03:12.82608
332	25	https://sv1.otruyencdn.com/v1/api/chapter/69ae28d1e0d753f32e58c98c	2026-03-10 10:03:12.82608
333	97	https://sv1.otruyencdn.com/v1/api/chapter/69ae28a0e0d753f32e58c93d	2026-03-10 10:03:12.82608
334	43	https://sv1.otruyencdn.com/v1/api/chapter/69ae289ae0d753f32e58c92b	2026-03-10 10:03:12.82608
335	42	https://sv1.otruyencdn.com/v1/api/chapter/69ae28747b89b5b2570e0d04	2026-03-10 10:03:12.82608
340	72	https://sv1.otruyencdn.com/v1/api/chapter/69b4e31be0d753f32e58ded3	2026-03-14 12:37:01.878906
341	83	https://sv1.otruyencdn.com/v1/api/chapter/69b4e314e0d753f32e58dec3	2026-03-14 12:37:01.878906
342	21	https://sv1.otruyencdn.com/v1/api/chapter/69b4e3127b89b5b2570e2178	2026-03-14 12:37:01.878906
324	10	https://sv1.otruyencdn.com/v1/api/chapter/69b4e30fe0d753f32e58deb6	2026-03-14 12:37:01.878906
344	1133	https://sv1.otruyencdn.com/v1/api/chapter/69b4e30c7b89b5b2570e2172	2026-03-14 12:37:01.878906
345	592	https://sv1.otruyencdn.com/v1/api/chapter/69b4e304e0d753f32e58deaa	2026-03-14 12:37:01.878906
346	437	https://sv1.otruyencdn.com/v1/api/chapter/69b4e304e0d753f32e58dea6	2026-03-14 12:37:01.878906
326	840	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2ef7b89b5b2570e2166	2026-03-14 12:37:01.878906
329	91	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2eee0d753f32e58de89	2026-03-14 12:37:01.878906
350	149	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2c3e0d753f32e58de44	2026-03-14 12:37:01.878906
352	193	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2b37b89b5b2570e2135	2026-03-14 12:37:01.878906
353	1131	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2ac7b89b5b2570e212b	2026-03-14 12:37:01.878906
354	96	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2a97b89b5b2570e2122	2026-03-14 12:37:01.878906
355	82	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2a8e0d753f32e58de16	2026-03-14 12:37:01.878906
356	168	https://sv1.otruyencdn.com/v1/api/chapter/69b4e29d7b89b5b2570e211b	2026-03-14 12:37:01.878906
357	11	https://sv1.otruyencdn.com/v1/api/chapter/69b4e26e7b89b5b2570e210d	2026-03-14 12:37:01.878906
358	91	https://sv1.otruyencdn.com/v1/api/chapter/69b4e26d7b89b5b2570e2107	2026-03-14 12:37:01.878906
359	170	https://sv1.otruyencdn.com/v1/api/chapter/69b4e26b7b89b5b2570e2101	2026-03-14 12:37:01.878906
275	19	https://sv1.otruyencdn.com/v1/api/chapter/69b4e26a7b89b5b2570e20c2	2026-03-14 12:37:01.878906
361	90	https://sv1.otruyencdn.com/v1/api/chapter/69b4e2557b89b5b2570e20b3	2026-03-14 12:37:01.878906
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (id, level_no, min_total_topup, name, created_at) FROM stdin;
2	1	1000000	Đồng	2026-02-20 22:10:33.12796
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, actor_user_id, type, title, body, url, created_at, read_at) FROM stdin;
1	1	16	NEW_COMIC	Tác giả bạn theo dõi vừa đăng truyện mới	Tonari No Furi-san Ga Tonikaku Kowai	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	2026-03-10 10:03:13.225324	2026-03-10 10:05:12.474365
25	17	16	NEW_COMIC	Tác giả bạn theo dõi vừa đăng truyện mới	Tonari No Furi-san Ga Tonikaku Kowai	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	2026-03-10 10:03:13.223952	2026-03-14 12:28:27.293788
102	17	1	NEW_SELF_COMIC	Tác giả bạn theo dõi vừa đăng truyện chữ mới	fgg	/self-comics/3	2026-03-14 14:41:41.674372	2026-03-14 14:42:52.344701
105	17	1	NEW_SELF_COMIC	Tác giả bạn theo dõi vừa đăng truyện chữ mới	ff	/self-comics/6	2026-03-14 14:59:09.668376	\N
106	17	1	NEW_SELF_COMIC	Tác giả bạn theo dõi vừa đăng truyện chữ mới	ggg	/self-comics/7	2026-03-14 14:59:42.914244	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name) FROM stdin;
1	user	Ngu?i d—ng
2	admin	Qu?n tr?
3	sub_admin	Admin ph?
\.


--
-- Data for Name: self_comic_chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.self_comic_chapters (id, comic_id, chapter_no, chapter_title, content, created_at) FROM stdin;
2	1	1	Chương 1	<p>Trong một ngày đầu năm mới, Nobita nằm gác chân ăn bánh nếp và nghĩ về một năm mới gặp nhiều may mắn. “Rất tiếc là không được như vậy”. Tiếng nói vọng ra từ ngăn kéo bàn học đánh dấu lần đầu tiên Doremon và Nobita gặp gỡ. Một tương lai u tối với màn kết hôn cùng Chaiko và hàng loạt nốt trầm trong cuộc sống được “show” ra khiến Nobita sợ xanh mặt. Nhưng cũng chính vì lẽ đó, sứ mệnh của Doremon là ở đây và giúp đỡ Nobita cứu vãn cuộc đời. Tình bạn gắn bó giữa cậu bé lớp 3 và chú mèo máy đến từ tương lai cũng bắt đầu từ đây!</p><img src="https://tuoitho.mobi/upload/doc-truyen/doraemon-truyen-ngan/chap-1/3.webp" alt="Trang 3 - Đôrêmon Ngắn Chap 1 *"><p></p><img src="https://res.cloudinary.com/dfy88xxg9/image/upload/v1773289273/self-comics/chapters/qpro9g6scyesnjdv12zm.jpg" alt="anh-dai-dien.jpg"><p></p>	2026-03-09 09:10:25.882045
\.


--
-- Data for Name: self_comics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.self_comics (id, user_id, title, cover_image, description, total_chapters, status, category_id, is_paid, price, created_at, updated_at, author, translated_by) FROM stdin;
1	16	Đôrêmon: Truyện Ngắn	https://res.cloudinary.com/dfy88xxg9/image/upload/v1773288396/self-comics/covers/cgdq8pzj1zimivpx1gzg.jpg	<p>Danh sách đầy đủ những chương của truyện Đôrêmon: Truyện Ngắn. Hackviet9b Fan luôn cập nhật truyện Đôrêmon Ngắn chương mới nhất một cách đầy đủ và nhanh chóng.</p>	10	1	3	t	9999	2026-03-06 21:53:14.360137	2026-03-12 11:06:35.999184	Fujiko F Fujio,	Minh hoàng
2	1	Pokémon - Cuộc Phiêu Lưu Của Pippi	https://res.cloudinary.com/dfy88xxg9/image/upload/v1773415827/self-comics/covers/hbmsbss1xlfwvxkmgaqb.webp	<p>Lượm được thì xả! Ảnh pokemon đẹp dành cho các fan ngắm nghía,bình phẩm hoặc cười đau bụng hay chỉ đơn giản mình thích thì mình coi! Cảm ơn, nếu mọi người thích! ^v^ P/s: Có thể đôi lúc au đăng truyện ngắn.</p>	10	1	4	t	7777777	2026-03-13 22:30:28.395681	2026-03-13 22:30:28.395681	Kosaku Anakubo	\N
\.


--
-- Data for Name: site_traffic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_traffic (id, path, session_id, visit_key, user_id, ip_address, user_agent, referer, created_at) FROM stdin;
1	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 21:36:57.315026
2	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 21:37:02.806803
3	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:15:50.03789
4	/	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:29:06.495689
5	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:30:42.992742
6	/profile	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:35:39.026127
7	/truyen?category=action	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:35:50.957694
8	/truyen/yuusha-gakuen-no-fukushuusei	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/truyen/yuusha-gakuen-no-fukushuusei	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:35:59.664739
9	/self-comics-category/=3	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:36:09.581954
10	/self-comics/1	sess_1773070146199_6m4p5wmo	sess_1773070146199_6m4p5wmo::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 22:36:30.682941
12	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:07:47.257472
11	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:07:47.257845
13	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:07:59.845417
14	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:17:25.388278
15	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:17:27.418024
16	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:19:22.443906
17	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:20:51.898164
18	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-09 23:20:52.595768
19	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:24:13.180202
20	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:24:13.185076
21	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:44:26.886257
22	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:42.276569
23	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:43.300382
24	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:43.918289
25	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:44.340565
26	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:44.799946
27	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:46:52.923298
28	/truyen/tinh-giap-hon-tuong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tinh-giap-hon-tuong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:47:56.287191
29	/truyen/tien-hoa-vo-han-bat-dau-tu-con-so-khong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tien-hoa-vo-han-bat-dau-tu-con-so-khong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:48:23.079977
30	/truyen/xem-phim-nguoi-lon-duoc-khong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xem-phim-nguoi-lon-duoc-khong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:48:38.504891
31	/doc?slug=xem-phim-nguoi-lon-duoc-khong&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6923e776dee12c04272f465e&comicId=268	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=xem-phim-nguoi-lon-duoc-khong&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6923e776dee12c04272f465e&comicId=268	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:48:42.257673
32	/notifications	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/notifications	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:49:53.250987
33	/notifications	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/notifications	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:50:09.531975
34	/truyen?category=co-dai	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:50:17.439784
35	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:50:29.752598
36	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:50:29.75622
37	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/profile	2026-03-10 09:51:14.68811
38	/truyen?category=adventure&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=co-dai	2026-03-10 09:53:47.019825
39	/	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 09:58:16.659495
40	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=adventure&page=1	2026-03-10 10:02:36.131085
41	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/	2026-03-10 10:02:49.091578
42	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tonari-no-furi-san-ga-tonikaku-kowai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=adventure&page=1	2026-03-10 10:03:23.082996
43	/truyen?category=fantasy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=fantasy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=adventure&page=1	2026-03-10 10:09:20.303267
44	/truyen?category=chuyen-sinh&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=adventure&page=1	2026-03-10 10:09:26.005512
45	/truyen?category=adventure	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 10:15:50.17804
46	/truyen?category=action	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 10:15:50.633689
47	/self-comics/1	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 10:16:01.555061
48	/truyen/xem-phim-nguoi-lon-duoc-khong	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/truyen/xem-phim-nguoi-lon-duoc-khong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 10:16:14.511141
49	/truyen/tinh-giap-hon-tuong	sess_1773111496546_ft7inkbu	sess_1773111496546_ft7inkbu::/truyen/tinh-giap-hon-tuong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 10:16:24.03737
50	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:18:58.43842
51	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:18:58.448123
52	/truyen/xem-phim-nguoi-lon-duoc-khong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xem-phim-nguoi-lon-duoc-khong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:19:02.772223
53	/truyen/tinh-giap-hon-tuong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tinh-giap-hon-tuong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:19:28.199337
54	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:19:39.310826
55	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:30.092782
56	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:30.798284
57	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:31.195165
191	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:00:25.451248
58	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:32.823669
59	/notifications	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/notifications	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:40.749015
60	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:40:47.777547
61	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:08.611786
62	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:08.613308
63	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:16.481053
64	/truyen?category=comedy	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:58.683514
65	/truyen?category=chuyen-sinh	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:59.541468
66	/truyen?category=adventure	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:41:59.973327
67	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:42:00.37289
68	/truyen/vo-dich-chi-voi-1-mau	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/vo-dich-chi-voi-1-mau	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:42:01.648236
69	/doc?slug=vo-dich-chi-voi-1-mau&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6960fa387b89b5b25706b22a&comicId=5	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/doc?slug=vo-dich-chi-voi-1-mau&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6960fa387b89b5b25706b22a&comicId=5	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:42:04.589065
70	/self-comics-category/=3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 20:45:54.645732
71	/doc?slug=xuyen-khong-toi-tu-tien-gioi-lam-tru-than&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F694e25f97b89b5b2570584e3&comicId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=xuyen-khong-toi-tu-tien-gioi-lam-tru-than&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F694e25f97b89b5b2570584e3&comicId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:01:06.478797
72	/truyen?category=cooking	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=cooking	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:21.532423
73	/truyen?page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:24.047047
74	/truyen?page=1&q=Y%C3%AAu+Th%E1%BA%A7n+K%C3%BD	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?page=1&q=Y%C3%AAu+Th%E1%BA%A7n+K%C3%BD	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:25.628029
75	/truyen/yeu-than-ky	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/yeu-than-ky	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:26.664024
76	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:36.962263
77	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:04:39.144589
78	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:15:12.70284
79	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-10 21:58:16.936542
80	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:17:22.109869
81	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:21:05.245501
82	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:37:53.687779
83	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:37:56.94435
84	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:40:14.450452
85	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:48:46.608391
86	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:48:47.854032
87	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:48:48.481063
88	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:48:49.130268
89	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:48:49.471857
90	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:49:03.441629
91	/truyen/xem-phim-nguoi-lon-duoc-khong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xem-phim-nguoi-lon-duoc-khong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:49:11.233199
92	/doc?slug=xem-phim-nguoi-lon-duoc-khong&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6965e72e7b89b5b25707a780&comicId=268	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=xem-phim-nguoi-lon-duoc-khong&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6965e72e7b89b5b25707a780&comicId=268	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 09:49:17.094517
93	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:52:12.45604
94	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:52:12.455793
95	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:52:23.806125
96	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:52:27.345259
97	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:53:35.374699
98	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:54:46.998502
99	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:55:31.544013
100	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:55:33.96393
101	/self-comics-category/=3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:55:35.629658
102	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:55:46.293302
103	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 19:59:52.040848
104	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:24:50.058997
105	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:24:56.519667
106	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:28:27.32916
107	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:28:28.323841
108	/truyen/vua-vo-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vua-vo-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:28:32.13444
109	/truyen/tien-vo-de-ton	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tien-vo-de-ton	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-11 20:28:54.8421
110	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 09:03:42.342604
111	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 09:03:42.341656
112	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 09:03:46.749934
113	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 09:03:49.529386
114	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 09:03:51.00835
115	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:21:51.849862
116	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:26:20.769071
117	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:26:22.406344
118	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:28:23.611059
119	/truyen/vuong-mien-viridescent	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:28:24.933948
120	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:30:13.584216
121	/truyen/yugo-ke-thuong-thuyet	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/yugo-ke-thuong-thuyet	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:30:14.339634
122	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:36:51.483419
123	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:36:54.154569
124	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:36:54.544336
125	/truyen?category=drama	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=drama	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:36:56.217591
126	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:36:59.221236
127	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 09:39:49.452417
128	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:05:40.703235
129	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:10:13.005158
130	/self-comics-category/=3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:10:22.90661
131	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:12:20.84123
132	/doc-self?comicId=1&chapterId=2	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:12:22.41436
133	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 11:12:40.472357
134	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:07:57.120393
135	/truyen/vuong-mien-viridescent	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:08:06.060174
136	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:08:17.73464
137	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:08:18.302197
138	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:27:58.282753
139	/truyen?category=cooking	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=cooking	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:27:59.146553
140	/truyen?category=horror	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=horror	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:28:03.099165
141	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:28:06.093833
142	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:28:21.446354
143	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:29:38.729697
144	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 13:53:02.108148
145	/doc-self?comicId=1&chapterId=2	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-12 13:53:03.899561
146	/self-comics-category/=3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:58:59.157219
147	/truyen?category=chuyen-sinh	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:59:00.610518
148	/truyen/vuong-mien-viridescent	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:59:01.299052
149	/doc?slug=vuong-mien-viridescent&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F65805b08e120ddf2198c7a49&comicId=316	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/doc?slug=vuong-mien-viridescent&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F65805b08e120ddf2198c7a49&comicId=316	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 13:59:03.157117
150	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:06:24.416659
151	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:21:53.198313
152	/truyen/vuong-mien-viridescent	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:21:53.901346
153	/doc?slug=vuong-mien-viridescent&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F65805b08e120ddf2198c7a49&comicId=316	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=vuong-mien-viridescent&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F65805b08e120ddf2198c7a49&comicId=316	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:21:57.145195
154	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:22:48.538087
155	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:22:49.284393
156	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:22:51.783504
157	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:45:03.645849
158	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:45:14.358696
159	/truyen/yeu-than-ky	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/yeu-than-ky	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:46:23.241005
160	/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681&comicId=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681&comicId=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:46:30.474545
161	/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 14:47:05.210104
162	/truyen?category=co-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:43.156326
163	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:43.867952
165	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:45.985985
164	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:44.483173
166	/truyen?category=cooking	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=cooking	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:46.826667
167	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:03:47.751352
168	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:16:07.076718
169	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:16:08.76674
170	/doc?slug=xuyen-khong-toi-tu-tien-gioi-lam-tru-than&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F694e26067b89b5b2570584f5&comicId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=xuyen-khong-toi-tu-tien-gioi-lam-tru-than&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F694e26067b89b5b2570584f5&comicId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:16:10.546495
171	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:17:21.992013
172	/truyen/yeu-than-ky	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/yeu-than-ky	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:31:24.905236
173	/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681&comicId=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681&comicId=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:31:27.063486
174	/truyen/vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:17.099947
175	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:25.925159
176	/truyen/vua-vo-dai	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vua-vo-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:29.42225
177	/doc?slug=vua-vo-dai&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6583f8b9ac52820f5646ceb4&comicId=317	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=vua-vo-dai&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F6583f8b9ac52820f5646ceb4&comicId=317	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:31.914606
178	/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc?slug=yeu-than-ky&chap=https%3A%2F%2Fsv1.otruyencdn.com%2Fv1%2Fapi%2Fchapter%2F659396e3e120ddf21993b681	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:45.611403
179	/self-comics-category/=3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:50.532974
180	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:51.178497
181	/doc-self?comicId=1&chapterId=2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/doc-self?comicId=1&chapterId=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 15:40:56.120384
182	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 20:54:35.583416
183	/truyen/van-co-chi-ton	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/van-co-chi-ton	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/admin/comics	2026-03-12 20:54:39.248711
185	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:38:28.131092
184	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:38:28.131725
186	/truyen/vuong-mien-viridescent	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:38:39.795378
187	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:38:53.981735
188	/my-comics	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:58:33.897005
189	/profile?tab=mycomics&action=edit&id=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile?tab=mycomics&action=edit&id=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:58:44.550207
190	/profile?tab=mycomics&action=chapters&id=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile?tab=mycomics&action=chapters&id=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 20:58:49.683247
192	/my-comics	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:00:28.395228
193	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:00:52.732945
194	/my-comics	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:01:23.41471
195	/profile?tab=mycomics&action=chapters&id=1	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile?tab=mycomics&action=chapters&id=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:01:27.499024
196	/profile?tab=mycomics&action=edit&id=1	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile?tab=mycomics&action=edit&id=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:01:34.355034
197	/profile?tab=mycomics&action=create	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile?tab=mycomics&action=create	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:22:07.482656
198	/profile	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:26:37.227552
199	/my-comics	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:35:40.970924
200	/my-comics	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 21:35:40.967608
201	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:24:27.619018
202	/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/xuyen-khong-toi-tu-tien-gioi-lam-tru-than	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:24:29.867218
203	/	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:26:49.956588
204	/profile	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:26:51.232842
205	/my-comics	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:26:55.94104
206	/self-comics-category/=3	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:30:37.90985
207	/self-comics/2	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:30:42.550488
208	/self-comics-category/=4	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/self-comics-category/=4	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:30:58.518236
209	/truyen?category=action	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:31:23.892375
210	/truyen?category=comedy	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:31:34.374964
211	/profile?tab=mycomics&action=chapters&id=2	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile?tab=mycomics&action=chapters&id=2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-13 22:32:33.855393
213	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 09:56:05.237326
212	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 09:56:05.23817
214	/profile	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 09:56:19.032795
215	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 09:56:38.217447
216	/self-comics/2	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:02:24.539574
217	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:02:40.183484
218	/self-comics-category/=4	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=4	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	2026-03-14 10:28:41.059727
219	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:32:48.01592
220	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:34:21.561684
221	/truyen?category=adventure	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:34:35.890555
222	/self-comics-category/=3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:37:11.926976
223	/self-comics-category/=3?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:37:14.883554
224	/self-comics-category/=3?page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=3?page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:37:16.367853
225	/truyen?category=comedy	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:37:25.320992
226	/truyen?category=co-dai	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=co-dai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:39:08.865065
227	/truyen?category=cooking	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=cooking	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:25.885774
228	/truyen?category=drama	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=drama	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:26.62589
229	/truyen?category=manga	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=manga	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:27.171172
230	/truyen?category=horror	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=horror	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:27.764813
231	/self-comics-category/=4?categoryId=3&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=4?categoryId=3&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:35.369793
232	/self-comics-category/=4?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/=4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:41:48.324313
233	/self-comics?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:43:27.214984
234	/self-comics-category/4?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:45:46.098375
235	/self-comics-category/3?categoryId=3&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/3?categoryId=3&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:45:48.896848
236	/truyen?category=chuyen-sinh	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:45:51.814167
237	/self-comics/2	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:46:02.921035
238	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 10:46:17.366016
239	/truyen/vuong-mien-viridescent	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/vuong-mien-viridescent	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	2026-03-14 10:55:20.334474
240	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	2026-03-14 12:23:52.370851
241	/truyen?category=xuyen-khong	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=xuyen-khong	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	2026-03-14 12:28:10.747322
242	/truyen?category=adventure	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	2026-03-14 12:28:13.490978
243	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen/tonari-no-furi-san-ga-tonikaku-kowai	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:28:27.345037
244	/self-comics-category/3?categoryId=3&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/3?categoryId=3&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:31:57.926279
245	/self-comics/1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:31:59.740668
246	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:36:29.488433
247	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:36:29.503391
248	/	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:36:38.123108
249	/truyen/vo-dich-bi-dong-tao-ra-tan-sat-thuong	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/vo-dich-bi-dong-tao-ra-tan-sat-thuong	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:38:00.320318
250	/profile	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:38:14.11395
251	/self-comics-category/4?categoryId=4&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:39:36.92194
252	/self-comics/2	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 12:39:37.604234
253	/truyen?category=cooking	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=cooking	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:13:02.563858
254	/truyen/tsuihousha-shokudou-e-youkoso	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/tsuihousha-shokudou-e-youkoso	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:13:03.540176
255	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:40:45.310895
256	/	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:40:45.322348
257	/self-comics-category/4?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:40:55.391892
258	/	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:40:59.97722
259	/self-comics-category/4?categoryId=4&page=1	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:03.527161
260	/self-comics/2	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:04.244226
261	/self-comics/2	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/2	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:11.735721
262	/my-comics	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:17.451292
263	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:55.072624
264	/self-comics	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:41:57.67281
265	/self-comics/3	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:42:18.373358
266	/self-comics/3	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics/3	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:42:52.509024
267	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:43:09.190029
268	/truyen	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:43:27.950739
269	/truyen?category=action	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:44:40.887779
270	/profile	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/profile	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:46:46.568321
271	/truyen?category=action	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 14:59:57.392889
272	/self-comics-category/3?categoryId=3&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/3?categoryId=3&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:00:04.305593
273	/truyen?category=adventure	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=adventure	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:00:05.264873
274	/self-comics-category/4?categoryId=4&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:01:56.272622
275	/self-comics/:1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/:1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:06:34.558737
276	/self-comics/1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics/1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:06:39.147574
277	/truyen?category=chuyen-sinh	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=chuyen-sinh	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:08:52.172643
278	/truyen?category=comedy	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=comedy	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:08:52.702196
279	/self-comics-category/3?categoryId=3&page=1&q=g	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/3?categoryId=3&page=1&q=g	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:09:05.147987
280	/self-comics-category/3?categoryId=3&page=1&q=gg	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/3?categoryId=3&page=1&q=gg	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:09:05.411801
281	/my-comics	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/my-comics	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	2026-03-14 15:09:12.689993
282	/self-comics-category/4?categoryId=4&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:29:25.602132
283	/self-comics-category/4?categoryId=4&page=1	sess_1773067022789_51p21z7a	sess_1773067022789_51p21z7a::/self-comics-category/4?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:30:30.188736
284	/truyen?category=action	sess_1773410483245_g2nsr3ob	sess_1773410483245_g2nsr3ob::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/truyen?category=action	2026-03-14 20:30:30.395099
285	/truyen?category=action	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen?category=action	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:35:25.783903
286	/	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:35:26.766895
287	/truyen/troi-sinh-mi-cot-ta-bi-do-nhi-yandere-de-mat-toi	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/truyen/troi-sinh-mi-cot-ta-bi-do-nhi-yandere-de-mat-toi	\N	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:52:35.085321
288	/self-comics	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics	\N	::1	Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:53:28.659402
289	/self-comics?categoryId=4&page=1	sess_1773067017173_6w35d42z	sess_1773067017173_6w35d42z::/self-comics?categoryId=4&page=1	\N	::1	Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	http://localhost:5173/self-comics-category/4?categoryId=4&page=1	2026-03-14 20:53:31.460873
\.


--
-- Data for Name: user_chapter_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_chapter_reads (id, user_id, comic_type, external_chapter_id, self_chapter_id, external_comic_id, self_comic_id, read_at, external_chapter_api, external_chapter_title) FROM stdin;
8	16	external	65902becac52820f564b56ca	\N	20	\N	2026-03-09 13:58:28.97912	https://sv1.otruyencdn.com/v1/api/chapter/65902becac52820f564b56ca	4
15	1	external	6923e776dee12c04272f465e	\N	268	\N	2026-03-10 09:48:44.189069	https://sv1.otruyencdn.com/v1/api/chapter/6923e776dee12c04272f465e	8
16	16	external	6960fa387b89b5b25706b22a	\N	5	\N	2026-03-10 20:42:06.517628	https://sv1.otruyencdn.com/v1/api/chapter/6960fa387b89b5b25706b22a	6
19	16	self	\N	2	\N	1	2026-03-12 13:58:57.522471	\N	\N
24	16	external	65805b08e120ddf2198c7a49	\N	316	\N	2026-03-12 13:59:05.255736	https://sv1.otruyencdn.com/v1/api/chapter/65805b08e120ddf2198c7a49	1
25	1	external	65805b08e120ddf2198c7a49	\N	316	\N	2026-03-12 14:21:59.042766	https://sv1.otruyencdn.com/v1/api/chapter/65805b08e120ddf2198c7a49	1
30	1	external	659396e3e120ddf21993b681	\N	1	\N	2026-03-12 14:46:32.442114	https://sv1.otruyencdn.com/v1/api/chapter/659396e3e120ddf21993b681	1
31	1	external	694e26067b89b5b2570584f5	\N	2	\N	2026-03-12 15:16:12.500798	https://sv1.otruyencdn.com/v1/api/chapter/694e26067b89b5b2570584f5	7
32	1	external	6583f8b9ac52820f5646ceb4	\N	317	\N	2026-03-12 15:40:33.885967	https://sv1.otruyencdn.com/v1/api/chapter/6583f8b9ac52820f5646ceb4	4
9	1	self	\N	2	\N	1	2026-03-12 15:41:04.892131	\N	\N
\.


--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_follows (id, follower_id, followee_id, created_at) FROM stdin;
5	17	16	2026-03-04 22:42:24.656411
8	1	16	2026-03-12 09:32:10.122927
9	17	1	2026-03-14 14:41:12.638638
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, phone, provider, google_id, password_hash, role_id, status, created_at) FROM stdin;
3	longbb	lebalong90@gmail.com	0339 171 545	local	\N	$2b$10$WZ0xtMvSgnX8CrbUgzJki.tMrheW7pIr/q3kDISFtiAPQ2bAJCluq	1	1	2026-02-18 22:08:26.098319
18	longe le	lebalong987451@gmail.com	\N	google	111877367279903624115	\N	1	1	2026-03-09 22:29:04.342794
1	bale	long1452@gmail.com	0339 171 545	local	105240375290208597958	$2b$10$q5Y4qC189i6PWbTBsHoPvuQ0rRj6qrPWV/p65P9XzjZnLOAOX9orq	3	1	2026-02-18 22:05:11.401234
16	admin1	longlbgcd210546@fpt.edu.vn	\N	local	\N	$2b$10$YiBlgYIe9K/VwEhYUxRKq.DtRA6gDvXL.k5rQz6eoXw505uYNxxTC	2	1	2026-02-20 21:52:50.218745
17	BaLong Le	balongle123@gmail.com	\N	google	113064438496548220012	\N	1	1	2026-02-28 22:01:44.794383
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallet_transactions (id, user_id, type, amount, note, created_at, order_id, trans_id, status) FROM stdin;
11	16	purchase	1000	Mua truyện: Yêu Thần Ký (yeu-than-ky)	2026-02-22 22:32:37.869666	\N	\N	success
12	1	purchase	-1000	Mua truyện: Yêu Thần Ký (yeu-than-ky)	2026-02-22 22:44:32.612959	\N	\N	success
1	1	topup_momo	100000	MoMo topup pending	2026-02-21 21:12:44.508743	MOMO1771683164507	\N	pending
2	1	topup_momo	100000	MoMo topup pending	2026-02-21 21:19:00.115087	MOMO1771683540050	\N	pending
3	1	topup_momo	50000	MoMo topup pending	2026-02-21 21:23:36.275852	MOMO1771683816107	\N	pending
4	1	topup_momo	50000	MoMo topup pending	2026-02-21 21:30:22.487163	MOMO1771684222315	\N	pending
5	1	topup_momo	200000	MoMo topup pending	2026-02-21 21:52:32.413712	MOMO1771685552315	\N	pending
6	1	topup_momo	100000	MoMo return success transId=4681024800	2026-02-21 21:56:16.572091	MOMO1771685776492	4681024800	success
7	1	topup_momo	200000	MoMo topup pending	2026-02-21 21:59:10.655003	MOMO1771685950490	\N	pending
8	1	topup_momo	200000	MoMo return success transId=4681040308	2026-02-21 22:01:26.713373	MOMO1771686086619	4681040308	success
9	1	topup_momo	500000	Thanh toán thành công	2026-02-21 22:32:23.519058	MOMO1771687943517	4681054233	success
10	16	topup_momo	100000	Thanh toán thành công	2026-02-22 22:30:45.641052	MOMO1771774245640	4681931800	success
13	16	purchase	-7999	Mua truyện external: Võ Đại Lang Mạnh Nhất Tái Sinh Ở Thế Giới Thủy Hử (vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu)	2026-03-09 09:26:03.312177	\N	\N	success
14	16	purchase	-88888	Mua truyện external: Yuusha Gakuen No Fukushuusei (yuusha-gakuen-no-fukushuusei)	2026-03-09 09:44:52.668774	\N	\N	success
15	1	purchase	-9999	Mua truyện tự đăng: Đôrêmon: Truyện Ngắn (#1)	2026-03-09 10:26:23.031857	\N	\N	success
16	1	purchase	-88888	Mua truyện external: Yuusha Gakuen No Fukushuusei (yuusha-gakuen-no-fukushuusei)	2026-03-09 10:27:46.616056	\N	\N	success
17	16	nạp tiền momo	200000	topup_momo	2026-03-09 14:17:23.857421	MOMO1773040643856	4695146132	success
18	1	purchase	-1000	Mua truyện external: Yêu Thần Ký (yeu-than-ky)	2026-03-12 14:46:25.542023	\N	\N	success
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (user_id, balance, updated_at) FROM stdin;
3	0	2026-02-18 22:08:26.098319
18	0	2026-03-09 22:29:04.342794
16	202113	2026-03-09 14:20:07.937527
17	0	2026-02-28 22:01:44.794383
1	699113	2026-03-12 14:46:25.542023
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- Name: chapter_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_comments_id_seq', 3, true);


--
-- Name: chapter_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_reactions_id_seq', 22, true);


--
-- Name: comic_purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_purchases_id_seq', 5, true);


--
-- Name: comic_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_ratings_id_seq', 39, true);


--
-- Name: external_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_categories_id_seq', 748, true);


--
-- Name: external_comics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_comics_id_seq', 361, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 106, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: self_comic_chapters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_comic_chapters_id_seq', 35, true);


--
-- Name: self_comics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_comics_id_seq', 7, true);


--
-- Name: site_traffic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_traffic_id_seq', 289, true);


--
-- Name: user_chapter_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_chapter_reads_id_seq', 34, true);


--
-- Name: user_follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_follows_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 18, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chapter_comments chapter_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_comments
    ADD CONSTRAINT chapter_comments_pkey PRIMARY KEY (id);


--
-- Name: chapter_reactions chapter_reactions_chapter_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_reactions
    ADD CONSTRAINT chapter_reactions_chapter_id_user_id_key UNIQUE (chapter_id, user_id);


--
-- Name: chapter_reactions chapter_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_reactions
    ADD CONSTRAINT chapter_reactions_pkey PRIMARY KEY (id);


--
-- Name: comic_purchases comic_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases
    ADD CONSTRAINT comic_purchases_pkey PRIMARY KEY (id);


--
-- Name: comic_ratings comic_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings
    ADD CONSTRAINT comic_ratings_pkey PRIMARY KEY (id);


--
-- Name: comic_ratings comic_ratings_type_comic_user_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings
    ADD CONSTRAINT comic_ratings_type_comic_user_unique UNIQUE (comic_type, comic_id, user_id);


--
-- Name: external_categories external_categories_api_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_categories
    ADD CONSTRAINT external_categories_api_id_key UNIQUE (api_id);


--
-- Name: external_categories external_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_categories
    ADD CONSTRAINT external_categories_pkey PRIMARY KEY (id);


--
-- Name: external_comic_categories external_comic_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comic_categories
    ADD CONSTRAINT external_comic_categories_pkey PRIMARY KEY (comic_id, category_id);


--
-- Name: external_comics external_comics_api_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comics
    ADD CONSTRAINT external_comics_api_id_key UNIQUE (api_id);


--
-- Name: external_comics external_comics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comics
    ADD CONSTRAINT external_comics_pkey PRIMARY KEY (id);


--
-- Name: external_latest_chapters external_latest_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_latest_chapters
    ADD CONSTRAINT external_latest_chapters_pkey PRIMARY KEY (comic_id);


--
-- Name: levels levels_level_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_level_no_key UNIQUE (level_no);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: self_comic_chapters self_comic_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comic_chapters
    ADD CONSTRAINT self_comic_chapters_pkey PRIMARY KEY (id);


--
-- Name: self_comics self_comics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comics
    ADD CONSTRAINT self_comics_pkey PRIMARY KEY (id);


--
-- Name: site_traffic site_traffic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_traffic
    ADD CONSTRAINT site_traffic_pkey PRIMARY KEY (id);


--
-- Name: self_comic_chapters uq_self_comic_chapter_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comic_chapters
    ADD CONSTRAINT uq_self_comic_chapter_no UNIQUE (comic_id, chapter_no);


--
-- Name: user_chapter_reads user_chapter_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads
    ADD CONSTRAINT user_chapter_reads_pkey PRIMARY KEY (id);


--
-- Name: user_follows user_follows_follower_id_followee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_followee_id_key UNIQUE (follower_id, followee_id);


--
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (user_id);


--
-- Name: ext_cat_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ext_cat_slug_idx ON public.external_categories USING btree (slug);


--
-- Name: ext_cc_cat_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ext_cc_cat_idx ON public.external_comic_categories USING btree (category_id);


--
-- Name: ext_comics_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ext_comics_name_idx ON public.external_comics USING gin (to_tsvector('simple'::regconfig, name));


--
-- Name: ext_comics_updated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ext_comics_updated_idx ON public.external_comics USING btree (updated_at DESC);


--
-- Name: ext_latest_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ext_latest_unique ON public.external_latest_chapters USING btree (comic_id);


--
-- Name: idx_chapter_reactions_chapter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_reactions_chapter_id ON public.chapter_reactions USING btree (chapter_id);


--
-- Name: idx_chapter_reactions_comic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_reactions_comic ON public.chapter_reactions USING btree (comic_id);


--
-- Name: idx_chapter_reactions_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_reactions_slug ON public.chapter_reactions USING btree (slug);


--
-- Name: idx_notif_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_site_traffic_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_traffic_created_at ON public.site_traffic USING btree (created_at DESC);


--
-- Name: idx_site_traffic_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_traffic_path ON public.site_traffic USING btree (path);


--
-- Name: idx_site_traffic_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_traffic_session_id ON public.site_traffic USING btree (session_id);


--
-- Name: idx_site_traffic_visit_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_traffic_visit_key ON public.site_traffic USING btree (visit_key);


--
-- Name: idx_user_follows_followee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_follows_followee ON public.user_follows USING btree (followee_id);


--
-- Name: idx_user_reads_external_comic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_reads_external_comic_id ON public.user_chapter_reads USING btree (external_comic_id);


--
-- Name: idx_user_reads_read_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_reads_read_at ON public.user_chapter_reads USING btree (read_at DESC);


--
-- Name: idx_user_reads_self_comic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_reads_self_comic_id ON public.user_chapter_reads USING btree (self_comic_id);


--
-- Name: idx_user_reads_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_reads_user_id ON public.user_chapter_reads USING btree (user_id);


--
-- Name: uq_user_read_external_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_user_read_external_chapter ON public.user_chapter_reads USING btree (user_id, comic_type, external_chapter_id) WHERE (comic_type = 'external'::text);


--
-- Name: uq_user_read_self_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_user_read_self_chapter ON public.user_chapter_reads USING btree (user_id, comic_type, self_chapter_id) WHERE (comic_type = 'self'::text);


--
-- Name: ux_chapter_reactions_user_comic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_chapter_reactions_user_comic ON public.chapter_reactions USING btree (user_id, comic_type, comic_id);


--
-- Name: ux_notif_dedup_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_notif_dedup_target ON public.notifications USING btree (user_id, actor_user_id, type, url);


--
-- Name: ux_users_email_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_users_email_provider ON public.users USING btree (email, provider);


--
-- Name: ux_users_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_users_google_id ON public.users USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- Name: ux_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_users_username ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: wtx_order_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wtx_order_id_unique ON public.wallet_transactions USING btree (order_id);


--
-- Name: wtx_trans_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wtx_trans_id_unique ON public.wallet_transactions USING btree (trans_id);


--
-- Name: wtx_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wtx_user_id_idx ON public.wallet_transactions USING btree (user_id);


--
-- Name: users trg_create_wallet; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_create_wallet AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();


--
-- Name: users trg_users_default_role; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_default_role BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_default_role_user();


--
-- Name: chapter_comments chapter_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_comments
    ADD CONSTRAINT chapter_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.chapter_comments(id) ON DELETE CASCADE;


--
-- Name: chapter_comments chapter_comments_self_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_comments
    ADD CONSTRAINT chapter_comments_self_chapter_id_fkey FOREIGN KEY (self_chapter_id) REFERENCES public.self_comic_chapters(id) ON DELETE CASCADE;


--
-- Name: chapter_comments chapter_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_comments
    ADD CONSTRAINT chapter_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chapter_reactions chapter_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter_reactions
    ADD CONSTRAINT chapter_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comic_purchases comic_purchases_external_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases
    ADD CONSTRAINT comic_purchases_external_comic_id_fkey FOREIGN KEY (external_comic_id) REFERENCES public.external_comics(id) ON DELETE CASCADE;


--
-- Name: comic_purchases comic_purchases_self_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases
    ADD CONSTRAINT comic_purchases_self_comic_id_fkey FOREIGN KEY (self_comic_id) REFERENCES public.self_comics(id) ON DELETE CASCADE;


--
-- Name: comic_purchases comic_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases
    ADD CONSTRAINT comic_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comic_ratings comic_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings
    ADD CONSTRAINT comic_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: external_comic_categories external_comic_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comic_categories
    ADD CONSTRAINT external_comic_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.external_categories(id) ON DELETE CASCADE;


--
-- Name: external_comic_categories external_comic_categories_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comic_categories
    ADD CONSTRAINT external_comic_categories_comic_id_fkey FOREIGN KEY (comic_id) REFERENCES public.external_comics(id) ON DELETE CASCADE;


--
-- Name: external_latest_chapters external_latest_chapters_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_latest_chapters
    ADD CONSTRAINT external_latest_chapters_comic_id_fkey FOREIGN KEY (comic_id) REFERENCES public.external_comics(id) ON DELETE CASCADE;


--
-- Name: external_comics fk_external_comics_owner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_comics
    ADD CONSTRAINT fk_external_comics_owner FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications fk_notif_actor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notif_actor FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications fk_notif_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: self_comic_chapters fk_self_comic_chapters_comic; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comic_chapters
    ADD CONSTRAINT fk_self_comic_chapters_comic FOREIGN KEY (comic_id) REFERENCES public.self_comics(id) ON DELETE CASCADE;


--
-- Name: self_comics fk_self_comics_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comics
    ADD CONSTRAINT fk_self_comics_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: self_comics fk_self_comics_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_comics
    ADD CONSTRAINT fk_self_comics_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: site_traffic site_traffic_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_traffic
    ADD CONSTRAINT site_traffic_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_chapter_reads user_chapter_reads_external_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads
    ADD CONSTRAINT user_chapter_reads_external_comic_id_fkey FOREIGN KEY (external_comic_id) REFERENCES public.external_comics(id) ON DELETE CASCADE;


--
-- Name: user_chapter_reads user_chapter_reads_self_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads
    ADD CONSTRAINT user_chapter_reads_self_chapter_id_fkey FOREIGN KEY (self_chapter_id) REFERENCES public.self_comic_chapters(id) ON DELETE CASCADE;


--
-- Name: user_chapter_reads user_chapter_reads_self_comic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads
    ADD CONSTRAINT user_chapter_reads_self_comic_id_fkey FOREIGN KEY (self_comic_id) REFERENCES public.self_comics(id) ON DELETE CASCADE;


--
-- Name: user_chapter_reads user_chapter_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_chapter_reads
    ADD CONSTRAINT user_chapter_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_followee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_followee_id_fkey FOREIGN KEY (followee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JOP2oHB29dPfaAoL66VXGPJBnN56vyVHzCCWTDB7xJsjdXFSAq2PqdicgPldrSW

