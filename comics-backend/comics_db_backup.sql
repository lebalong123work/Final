--
-- PostgreSQL database dump
--

\restrict Cye25agrPkAbmXGX5PY8osgXsehKkfljMmRaBOhVw7KIzmyUmy2k6BS24NZKNwm

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
    created_at timestamp without time zone DEFAULT now()
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

COPY public.chapter_reactions (id, chapter_id, user_id, created_at) FROM stdin;
5	659396e3e120ddf21993b681	1	2026-02-23 22:58:50.32395
6	659396e4e120ddf21993b684	16	2026-02-23 23:06:43.055404
7	658dc729ac52820f564a5a60	16	2026-02-25 23:05:35.645212
8	694e25fc7b89b5b2570584e6	16	2026-03-08 22:31:55.309065
9	65915687e120ddf21992a88b	1	2026-03-09 10:39:17.336622
10	65915687e120ddf21992a88b	16	2026-03-09 10:50:06.67458
11	2	16	2026-03-09 11:08:14.807671
12	66478b18a4468f0e0dd1d1e6	16	2026-03-09 11:14:09.86321
13	65902becac52820f564b56ca	16	2026-03-09 13:58:37.896044
14	6960fa387b89b5b25706b22a	16	2026-03-10 20:42:06.748858
\.


--
-- Data for Name: comic_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_purchases (id, user_id, comic_type, external_comic_id, self_comic_id, comic_slug, comic_api_id, price, created_at) FROM stdin;
1	16	external	221	\N	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu	69256445679e2c7ab9378e7b	7999	2026-03-09 09:26:03.312177
2	16	external	266	\N	yuusha-gakuen-no-fukushuusei	69a6a80d679e2c7ab98ca565	88888	2026-03-09 09:44:52.668774
3	1	self	\N	1	\N	\N	9999	2026-03-09 10:26:23.031857
4	1	external	266	\N	yuusha-gakuen-no-fukushuusei	69a6a80d679e2c7ab98ca565	88888	2026-03-09 10:27:46.616056
\.


--
-- Data for Name: comic_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_ratings (id, comic_type, comic_id, user_id, rating, created_at, updated_at) FROM stdin;
3	self	1	1	4	2026-03-08 23:30:15.211928	2026-03-08 23:30:15.211928
7	external	268	16	4	2026-03-09 09:43:38.290329	2026-03-09 09:43:38.290329
1	self	1	16	5	2026-03-08 23:21:58.75057	2026-03-09 09:44:21.458839
9	external	11	16	3	2026-03-09 12:43:12.137964	2026-03-09 12:43:12.137964
10	external	218	1	5	2026-03-09 12:59:13.375573	2026-03-09 12:59:34.514995
28	external	266	1	4	2026-03-09 21:01:28.134933	2026-03-09 21:01:28.134933
29	external	268	1	5	2026-03-10 09:48:40.294036	2026-03-10 09:48:40.294036
30	external	335	1	3	2026-03-10 10:09:16.315428	2026-03-10 10:09:16.315428
\.


--
-- Data for Name: external_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_categories (id, api_id, name, slug) FROM stdin;
211	6508654905d5791ad671a4dc	Martial Arts	martial-arts
14	6508654905d5791ad671a4ac	Chuyển Sinh	chuyen-sinh
228	6508654905d5791ad671a4ce	Historical	historical
5	6508654a05d5791ad671a510	Truyện Màu	truyen-mau
406	6508654a05d5791ad671a516	Xuyên Không	xuyen-khong
204	6508654905d5791ad671a4d0	Horror	horror
3	6508654905d5791ad671a4d8	Manhua	manhua
42	6508654905d5791ad671a4e2	Mystery	mystery
652	6508654905d5791ad671a4b5	Cooking	cooking
55	6508654905d5791ad671a4a6	Adventure	adventure
2	6508654905d5791ad671a4c7	Fantasy	fantasy
64	6508654a05d5791ad671a504	Supernatural	supernatural
426	6508654a05d5791ad671a514	Webtoon	webtoon
28	6508654905d5791ad671a4f2	Shoujo	shoujo
33	6508654905d5791ad671a4ec	School Life	school-life
241	6508654905d5791ad671a4f0	Seinen	seinen
242	6508654a05d5791ad671a4fa	Slice of Life	slice-of-life
19	6508654905d5791ad671a4af	Comedy	comedy
20	6508654905d5791ad671a4be	Drama	drama
50	6508654905d5791ad671a4e0	Mecha	mecha
21	6508654905d5791ad671a4d6	Manga	manga
16	6508654905d5791ad671a4e4	Ngôn Tình	ngon-tinh
17	6508654905d5791ad671a4ea	Romance	romance
4	6508654905d5791ad671a4f6	Shounen	shounen
1	6508654905d5791ad671a491	Action	action
65	6508654a05d5791ad671a50a	Tragedy	tragedy
56	6508654905d5791ad671a4b8	Cổ Đại	co-dai
15	6508654905d5791ad671a4da	Manhwa	manhwa
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
\.


--
-- Data for Name: external_comics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_comics (id, api_id, name, slug, origin_name, status, thumb_url, sub_docquyen, is_paid, price, updated_at, created_at, owner_user_id, translator) FROM stdin;
220	6598f51668e54cf5b50a31be	Vô Địch Bị Động Tạo Ra Tấn Sát Thương	vo-dich-bi-dong-tao-ra-tan-sat-thuong		ongoing	vo-dich-bi-dong-tao-ra-tan-sat-thuong-thumb.jpg	f	f	0	2026-02-25 10:07:12.653	2026-02-25 21:29:31.815549	16	\N
3	69290329679e2c7ab93dafa4	Wizard's Soul ~Koi No Seisen~	wizards-soul-koi-no-seisen	Wizard's Soul ~koi No Seisen~	ongoing	wizards-soul-koi-no-seisen-thumb.jpg	f	f	0	2026-03-05 12:51:52.076	2026-02-22 15:11:10.655112	\N	\N
4	69410b2d0a67720d2312af82	Vừa Vô Địch Tại Mạt Thế Đã Bị Chặn Cửa Cầu Hôn	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon		ongoing	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon-thumb.jpg	f	f	0	2026-02-14 16:22:59.535	2026-02-22 15:11:10.655112	\N	\N
6	67d650c0a4a4a602fb8d30d3	Vật Giá Sụt Giảm, Triệu Phú Quay Về	vat-gia-sut-giam-trieu-phu-quay-ve	Vật Giá Sụt Giảm | Triệu Phú Quay Về	ongoing	vat-gia-sut-giam-trieu-phu-quay-ve-thumb.jpg	f	f	0	2026-02-14 16:22:41.417	2026-02-22 15:11:10.655112	\N	\N
7	68d7831554ddf1823a6b8425	Tu Tiên Thần Tốc	tu-tien-than-toc	Tu Tiên Thần Tốc	ongoing	tu-tien-than-toc-thumb.jpg	f	f	0	2026-02-14 16:22:32.285	2026-02-22 15:11:10.655112	\N	\N
8	68f46d34911ae532d4cfe064	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	ongoing	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no-thumb.jpg	f	f	0	2026-02-14 16:22:22.33	2026-02-22 15:11:10.655112	\N	\N
5	693f8d540a67720d23124b3a	Vô Địch Chỉ Với 1 Máu	vo-dich-chi-voi-1-mau		ongoing	vo-dich-chi-voi-1-mau-thumb.jpg	f	f	0	2026-03-09 09:58:56.676	2026-02-22 15:11:10.655112	\N	\N
9	672da13d80217a7ba9bdc03d	Trụ Vương Tái Sinh Không Muốn Làm Đại Phản Diện	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien		ongoing	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien-thumb.jpg	f	f	0	2026-03-09 09:57:40.281	2026-02-22 15:11:10.655112	\N	\N
1	659380a910dc9c0a7e2e5d5a	Yêu Thần Ký	yeu-than-ky	Tales of Demons And Gods	ongoing	yeu-than-ky-thumb.jpg	f	t	1000	2026-03-10 20:58:40.015862	2026-02-22 15:11:10.655112	\N	Minh khải
10	658cf3c310dc9c0a7e2e3ae0	Trở Thành Cô Vợ Khế Ước Của Nhân Vật Phản Diện	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien	Trở thành gia đình của nhân vật phản diện | Khế Ước Trở Thành Gia Đình Với Ác Ma	ongoing	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien-thumb.jpg	f	f	0	2026-02-14 16:22:07.091	2026-02-22 15:11:10.655112	\N	\N
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
224	67516df8a4a4a602fb797880	Tuyệt Đối Dân Cư	tuyet-doi-dan-cu	Tuyệt Đối Dân Cư	ongoing	tuyet-doi-dan-cu-thumb.jpg	f	f	0	2026-02-25 10:06:32.145	2026-02-25 21:29:31.815549	16	\N
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
329	69533ae00a67720d231c4651	Tsubasa - Giấc Mơ Sân Cỏ	tsubasa-giac-mo-san-co	Tsubasa | Giấc Mơ Sân Cỏ	ongoing	tsubasa-giac-mo-san-co-thumb.jpg	f	f	0	2026-03-09 09:57:46.525	2026-03-10 10:03:12.82608	16	\N
331	6975ed090a67720d232f9e8d	Trở Thành Người Trong Gia Đình Công Tước Đứng Sau Mọi Chuyện	tro-thanh-nguoi-trong-gia-dinh-cong-tuoc-dung-sau-moi-chuyen	Trở Thành Người Trong Gia Đình Công Tước Đứng Sau Mọi Chuyện	ongoing	tro-thanh-nguoi-trong-gia-dinh-cong-tuoc-dung-sau-moi-chuyen-thumb.jpg	f	f	0	2026-03-09 09:57:31.426	2026-03-10 10:03:12.82608	16	\N
332	69a6a3f30a67720d2357eff9	Trở Thành Đại Hoàng Tử: Huyền Thoại Kiếm Ca	tro-thanh-dai-hoang-tu-huyen-thoai-kiem-ca		coming_soon	tro-thanh-dai-hoang-tu-huyen-thoai-kiem-ca-thumb.jpg	f	f	0	2026-03-09 09:57:24.626	2026-03-10 10:03:12.82608	16	\N
333	676b97fda4a4a602fb7d9a52	Trở Thành Anh Hùng Mạnh Nhất Nhờ Gian Lận	tro-thanh-anh-hung-manh-nhat-nho-gian-lan	Trở Thành Anh Hùng Mạnh Nhất Nhờ Gian Lận	ongoing	tro-thanh-anh-hung-manh-nhat-nho-gian-lan-thumb.jpg	f	f	0	2026-03-09 09:57:18.096	2026-03-10 10:03:12.82608	16	\N
334	68e49076911ae532d4cd3586	Trả Thù Trong Bất Chính	tra-thu-trong-bat-chinh		ongoing	tra-thu-trong-bat-chinh-thumb.jpg	f	f	0	2026-03-09 09:57:12.086	2026-03-10 10:03:12.82608	16	\N
335	6571281c68e54cf5b5083cf3	Tonari No Furi-san Ga Tonikaku Kowai	tonari-no-furi-san-ga-tonikaku-kowai	Yankee Bàn Bên	ongoing	tonari-no-furi-san-ga-tonikaku-kowai-thumb.jpg	f	f	0	2026-03-09 09:57:05.883	2026-03-10 10:03:12.82608	16	\N
11	658e76bc68e54cf5b508fcb0	Tóm Lại Là Em Dễ Thương Được Chưa ?	tom-lai-la-em-de-thuong-duoc-chua		coming_soon	tom-lai-la-em-de-thuong-duoc-chua-thumb.jpg	f	f	0	2026-03-09 09:57:00.223	2026-02-22 15:11:10.655112	\N	\N
275	69842b840a67720d23406721	Tôi Trở Thành Người Được Nữ Phản Diện Yêu Thích Nhất	toi-tro-thanh-nguoi-duoc-nu-phan-dien-yeu-thich-nhat	Tôi Trở Thành Người Được Nữ Phản Diện Yêu Thích Nhất	ongoing	toi-tro-thanh-nguoi-duoc-nu-phan-dien-yeu-thich-nhat-thumb.jpg	f	f	0	2026-03-09 09:56:51.546	2026-03-06 08:41:36.654866	16	\N
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
324	69a7e2c10a67720d2358d7f6	Tỷ Phú Ở Rể	ty-phu-o-re	Tỷ Phú Ở Rể	coming_soon	ty-phu-o-re-thumb.jpg	f	f	0	2026-03-09 09:58:23.542	2026-03-10 10:03:12.82608	16	\N
325	66f3cd5b80217a7ba9b4eead	Tuyệt Thế Hồi Quy	tuyet-the-hoi-quy		ongoing	tuyet-the-hoi-quy-thumb.jpg	f	f	0	2026-03-09 09:58:17.26	2026-03-10 10:03:12.82608	16	\N
326	6906caa9911ae532d4d4793f	Tung Tiền Hữu Tọa Linh Kiếm Sơn	tung-tien-huu-toa-linh-kiem-son	Trước Kia Có Tòa Linh Kiếm Sơn	ongoing	tung-tien-huu-toa-linh-kiem-son-thumb.jpg	f	f	0	2026-03-09 09:58:08.739	2026-03-10 10:03:12.82608	16	\N
327	658a458b10dc9c0a7e2e2d28	Tsuihousha Shokudou E Youkoso!	tsuihousha-shokudou-e-youkoso	Welcome To Cheap Restaurant Of Outcast!	ongoing	tsuihousha-shokudou-e-youkoso-thumb.jpg	f	f	0	2026-03-09 09:58:02.963	2026-03-10 10:03:12.82608	16	\N
328	68ef67dd54ddf1823a70bcdc	Tsuiho Sareta Ossan Tanya Shi, Naze Ka Densetsu No Daimeiko Ni Naru	tsuiho-sareta-ossan-tanya-shi-naze-ka-densetsu-no-daimeiko-ni-naru		ongoing	tsuiho-sareta-ossan-tanya-shi-naze-ka-densetsu-no-daimeiko-ni-naru-thumb.jpg	f	f	0	2026-03-09 09:57:57.647	2026-03-10 10:03:12.82608	16	\N
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
220	153	https://sv1.otruyencdn.com/v1/api/chapter/699e66c57b89b5b2570dcb45	2026-02-25 21:31:37.72871
222	36	https://sv1.otruyencdn.com/v1/api/chapter/699e6698e0d753f32e588866	2026-02-25 21:31:37.72871
223	499	https://sv1.otruyencdn.com/v1/api/chapter/699e66907b89b5b2570dcb1b	2026-02-25 21:31:37.72871
224	68.1	https://sv1.otruyencdn.com/v1/api/chapter/699e66767b89b5b2570dcb07	2026-02-25 21:31:37.72871
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
9	201	https://sv1.otruyencdn.com/v1/api/chapter/69ae28d67b89b5b2570e0d12	2026-03-10 10:03:12.82608
11	339	https://sv1.otruyencdn.com/v1/api/chapter/69ae2872e0d753f32e58c915	2026-03-10 10:03:12.82608
240	33	https://sv1.otruyencdn.com/v1/api/chapter/699e65457b89b5b2570dca31	2026-02-25 21:31:37.72871
241	33	https://sv1.otruyencdn.com/v1/api/chapter/699e6503e0d753f32e58874a	2026-02-25 21:31:37.72871
266	25	https://sv1.otruyencdn.com/v1/api/chapter/69a90b1de0d753f32e58bcdc	2026-03-06 22:05:41.58629
268	33	https://sv1.otruyencdn.com/v1/api/chapter/69a90a64e0d753f32e58bc8e	2026-03-06 22:05:41.58629
269	2	https://sv1.otruyencdn.com/v1/api/chapter/69a909e5e0d753f32e58bc1a	2026-03-06 22:05:41.58629
271	26	https://sv1.otruyencdn.com/v1/api/chapter/69a909d5e0d753f32e58bbf2	2026-03-06 22:05:41.58629
272	20	https://sv1.otruyencdn.com/v1/api/chapter/69a909c97b89b5b2570e0556	2026-03-06 22:05:41.58629
273	8	https://sv1.otruyencdn.com/v1/api/chapter/69a7b0bb7b89b5b2570dfd7d	2026-03-06 22:05:41.58629
274	76	https://sv1.otruyencdn.com/v1/api/chapter/69a9099ee0d753f32e58bbc4	2026-03-06 22:05:41.58629
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
324	7	https://sv1.otruyencdn.com/v1/api/chapter/69ae2908e0d753f32e58c9d9	2026-03-10 10:03:12.82608
325	91	https://sv1.otruyencdn.com/v1/api/chapter/69ae28fb7b89b5b2570e0d5d	2026-03-10 10:03:12.82608
326	826	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f6e0d753f32e58c9be	2026-03-10 10:03:12.82608
327	51	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f27b89b5b2570e0d57	2026-03-10 10:03:12.82608
328	8.3	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f1e0d753f32e58c99c	2026-03-10 10:03:12.82608
329	69	https://sv1.otruyencdn.com/v1/api/chapter/69ae28f07b89b5b2570e0d51	2026-03-10 10:03:12.82608
331	10	https://sv1.otruyencdn.com/v1/api/chapter/69ae28d27b89b5b2570e0d0c	2026-03-10 10:03:12.82608
332	25	https://sv1.otruyencdn.com/v1/api/chapter/69ae28d1e0d753f32e58c98c	2026-03-10 10:03:12.82608
333	97	https://sv1.otruyencdn.com/v1/api/chapter/69ae28a0e0d753f32e58c93d	2026-03-10 10:03:12.82608
334	43	https://sv1.otruyencdn.com/v1/api/chapter/69ae289ae0d753f32e58c92b	2026-03-10 10:03:12.82608
335	42	https://sv1.otruyencdn.com/v1/api/chapter/69ae28747b89b5b2570e0d04	2026-03-10 10:03:12.82608
275	16	https://sv1.otruyencdn.com/v1/api/chapter/69ae286d7b89b5b2570e0cfe	2026-03-10 10:03:12.82608
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
25	17	16	NEW_COMIC	Tác giả bạn theo dõi vừa đăng truyện mới	Tonari No Furi-san Ga Tonikaku Kowai	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	2026-03-10 10:03:13.223952	\N
1	1	16	NEW_COMIC	Tác giả bạn theo dõi vừa đăng truyện mới	Tonari No Furi-san Ga Tonikaku Kowai	/truyen/tonari-no-furi-san-ga-tonikaku-kowai	2026-03-10 10:03:13.225324	2026-03-10 10:05:12.474365
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
2	1	1	Chương 1	<p>Trong một ngày đầu năm mới, Nobita nằm gác chân ăn bánh nếp và nghĩ về một năm mới gặp nhiều may mắn. “Rất tiếc là không được như vậy”. Tiếng nói vọng ra từ ngăn kéo bàn học đánh dấu lần đầu tiên Doremon và Nobita gặp gỡ. Một tương lai u tối với màn kết hôn cùng Chaiko và hàng loạt nốt trầm trong cuộc sống được “show” ra khiến Nobita sợ xanh mặt. Nhưng cũng chính vì lẽ đó, sứ mệnh của Doremon là ở đây và giúp đỡ Nobita cứu vãn cuộc đời. Tình bạn gắn bó giữa cậu bé lớp 3 và chú mèo máy đến từ tương lai cũng bắt đầu từ đây!</p><img src="https://tuoitho.mobi/upload/doc-truyen/doraemon-truyen-ngan/chap-1/3.webp" alt="Trang 3 - Đôrêmon Ngắn Chap 1 *"><p></p>	2026-03-09 09:10:25.882045
\.


--
-- Data for Name: self_comics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.self_comics (id, user_id, title, cover_image, description, total_chapters, status, category_id, is_paid, price, created_at, updated_at, author) FROM stdin;
1	16	Đôrêmon: Truyện Ngắn	data:image/jpeg;base64,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	<p>Danh sách đầy đủ những chương của truyện Đôrêmon: Truyện Ngắn. Hackviet9b Fan luôn cập nhật truyện Đôrêmon Ngắn chương mới nhất một cách đầy đủ và nhanh chóng.</p>	10	1	3	t	9999	2026-03-06 21:53:14.360137	2026-03-09 10:15:12.775568	Fujiko F Fujio,
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
\.


--
-- Data for Name: user_chapter_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_chapter_reads (id, user_id, comic_type, external_chapter_id, self_chapter_id, external_comic_id, self_comic_id, read_at, external_chapter_api, external_chapter_title) FROM stdin;
8	16	external	65902becac52820f564b56ca	\N	20	\N	2026-03-09 13:58:28.97912	https://sv1.otruyencdn.com/v1/api/chapter/65902becac52820f564b56ca	4
9	1	self	\N	2	\N	1	2026-03-09 23:20:48.016657	\N	\N
15	1	external	6923e776dee12c04272f465e	\N	268	\N	2026-03-10 09:48:44.189069	https://sv1.otruyencdn.com/v1/api/chapter/6923e776dee12c04272f465e	8
16	16	external	6960fa387b89b5b25706b22a	\N	5	\N	2026-03-10 20:42:06.517628	https://sv1.otruyencdn.com/v1/api/chapter/6960fa387b89b5b25706b22a	6
\.


--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_follows (id, follower_id, followee_id, created_at) FROM stdin;
5	17	16	2026-03-04 22:42:24.656411
6	1	16	2026-03-09 10:32:56.300696
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, phone, provider, google_id, password_hash, role_id, status, created_at) FROM stdin;
3	thuanee	huynhduythuan68@gmail.com	0339 171 545	local	\N	$2b$10$WZ0xtMvSgnX8CrbUgzJki.tMrheW7pIr/q3kDISFtiAPQ2bAJCluq	1	1	2026-02-18 22:08:26.098319
18	thuan huynh	huynhtuhan123456@gmail.com	\N	google	111877367279903624115	\N	1	1	2026-03-09 22:29:04.342794
1	thuan	huynhduythuan668@gmail.com	0339 171 545	local	105240375290208597958	$2b$10$q5Y4qC189i6PWbTBsHoPvuQ0rRj6qrPWV/p65P9XzjZnLOAOX9orq	3	1	2026-02-18 22:05:11.401234
16	admin1	longlbgcd210546@fpt.edu.vn	\N	local	\N	$2b$10$YiBlgYIe9K/VwEhYUxRKq.DtRA6gDvXL.k5rQz6eoXw505uYNxxTC	2	1	2026-02-20 21:52:50.218745
17	Duythuan Huynh	duythuanh700@gmail.com	\N	google	113064438496548220012	\N	1	1	2026-02-28 22:01:44.794383
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
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (user_id, balance, updated_at) FROM stdin;
3	0	2026-02-18 22:08:26.098319
18	0	2026-03-09 22:29:04.342794
17	0	2026-02-28 22:01:44.794383
16	202113	2026-03-09 14:20:07.937527
1	700113	2026-03-09 10:27:46.616056
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 3, true);


--
-- Name: chapter_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_comments_id_seq', 3, true);


--
-- Name: chapter_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_reactions_id_seq', 14, true);


--
-- Name: comic_purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_purchases_id_seq', 4, true);


--
-- Name: comic_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_ratings_id_seq', 30, true);


--
-- Name: external_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_categories_id_seq', 674, true);


--
-- Name: external_comics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_comics_id_seq', 337, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 101, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: self_comic_chapters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_comic_chapters_id_seq', 2, true);


--
-- Name: self_comics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_comics_id_seq', 1, true);


--
-- Name: site_traffic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_traffic_id_seq', 77, true);


--
-- Name: user_chapter_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_chapter_reads_id_seq', 16, true);


--
-- Name: user_follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_follows_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 17, true);


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
-- Name: ux_notif_dedup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_notif_dedup ON public.notifications USING btree (user_id, actor_user_id, type);


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

\unrestrict Cye25agrPkAbmXGX5PY8osgXsehKkfljMmRaBOhVw7KIzmyUmy2k6BS24NZKNwm

