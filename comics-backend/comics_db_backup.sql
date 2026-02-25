--
-- PostgreSQL database dump
--

\restrict tOaBS7Ur96dFeGjka4PV0dn87BbyMWbGvZYFo8IlMALkTS7VKW6fTf8bIWmjEuj

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
-- Name: chapter_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chapter_comments (
    id bigint NOT NULL,
    chapter_id text NOT NULL,
    user_id bigint NOT NULL,
    parent_id bigint,
    text text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
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
    comic_api_id text NOT NULL,
    comic_slug text NOT NULL,
    price bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
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
    id integer NOT NULL,
    comic_slug character varying(200) NOT NULL,
    user_id integer NOT NULL,
    rating integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT comic_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.comic_ratings OWNER TO postgres;

--
-- Name: comic_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comic_ratings_id_seq
    AS integer
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
-- Data for Name: chapter_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapter_comments (id, chapter_id, user_id, parent_id, text, created_at) FROM stdin;
\.


--
-- Data for Name: chapter_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapter_reactions (id, chapter_id, user_id, created_at) FROM stdin;
5	659396e3e120ddf21993b681	1	2026-02-23 22:58:50.32395
6	659396e4e120ddf21993b684	16	2026-02-23 23:06:43.055404
\.


--
-- Data for Name: comic_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_purchases (id, user_id, comic_api_id, comic_slug, price, created_at) FROM stdin;
1	16	659380a910dc9c0a7e2e5d5a	yeu-than-ky	1000	2026-02-22 22:32:37.869666
2	1	659380a910dc9c0a7e2e5d5a	yeu-than-ky	1000	2026-02-22 22:44:32.612959
\.


--
-- Data for Name: comic_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comic_ratings (id, comic_slug, user_id, rating, created_at, updated_at) FROM stdin;
1	vuong-mien-viridescent	16	3	2026-02-24 21:58:30.593084	2026-02-24 21:58:30.593084
2	vuong-mien-viridescent	1	3	2026-02-24 21:58:57.95095	2026-02-24 21:58:57.95095
3	vong-du-afk-tram-van-nam-ta-thuc-tinh-thanh-than	1	4	2026-02-24 22:34:20.529195	2026-02-24 23:24:19.430212
5	yugo-ke-thuong-thuyet	1	4	2026-02-25 21:30:17.282399	2026-02-25 21:30:17.282399
6	tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le	1	3	2026-02-25 21:42:44.421745	2026-02-25 21:42:44.421745
\.


--
-- Data for Name: external_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_categories (id, api_id, name, slug) FROM stdin;
33	6508654905d5791ad671a4ec	School Life	school-life
406	6508654a05d5791ad671a516	Xuyên Không	xuyen-khong
211	6508654905d5791ad671a4dc	Martial Arts	martial-arts
19	6508654905d5791ad671a4af	Comedy	comedy
228	6508654905d5791ad671a4ce	Historical	historical
16	6508654905d5791ad671a4e4	Ngôn Tình	ngon-tinh
17	6508654905d5791ad671a4ea	Romance	romance
55	6508654905d5791ad671a4a6	Adventure	adventure
2	6508654905d5791ad671a4c7	Fantasy	fantasy
3	6508654905d5791ad671a4d8	Manhua	manhua
241	6508654905d5791ad671a4f0	Seinen	seinen
242	6508654a05d5791ad671a4fa	Slice of Life	slice-of-life
64	6508654a05d5791ad671a504	Supernatural	supernatural
5	6508654a05d5791ad671a510	Truyện Màu	truyen-mau
426	6508654a05d5791ad671a514	Webtoon	webtoon
28	6508654905d5791ad671a4f2	Shoujo	shoujo
1	6508654905d5791ad671a491	Action	action
14	6508654905d5791ad671a4ac	Chuyển Sinh	chuyen-sinh
56	6508654905d5791ad671a4b8	Cổ Đại	co-dai
50	6508654905d5791ad671a4e0	Mecha	mecha
4	6508654905d5791ad671a4f6	Shounen	shounen
204	6508654905d5791ad671a4d0	Horror	horror
20	6508654905d5791ad671a4be	Drama	drama
21	6508654905d5791ad671a4d6	Manga	manga
65	6508654a05d5791ad671a50a	Tragedy	tragedy
42	6508654905d5791ad671a4e2	Mystery	mystery
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
\.


--
-- Data for Name: external_comics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_comics (id, api_id, name, slug, origin_name, status, thumb_url, sub_docquyen, is_paid, price, updated_at, created_at, owner_user_id) FROM stdin;
220	6598f51668e54cf5b50a31be	Vô Địch Bị Động Tạo Ra Tấn Sát Thương	vo-dich-bi-dong-tao-ra-tan-sat-thuong		ongoing	vo-dich-bi-dong-tao-ra-tan-sat-thuong-thumb.jpg	f	f	0	2026-02-25 10:07:12.653	2026-02-25 21:29:31.815549	16
3	69290329679e2c7ab93dafa4	Wizard's Soul ~Koi No Seisen~	wizards-soul-koi-no-seisen	Wizard's Soul ~koi No Seisen~	ongoing	wizards-soul-koi-no-seisen-thumb.jpg	f	f	0	2026-02-14 16:23:11.064	2026-02-22 15:11:10.655112	\N
4	69410b2d0a67720d2312af82	Vừa Vô Địch Tại Mạt Thế Đã Bị Chặn Cửa Cầu Hôn	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon		ongoing	vua-vo-dich-tai-mat-the-da-bi-chan-cua-cau-hon-thumb.jpg	f	f	0	2026-02-14 16:22:59.535	2026-02-22 15:11:10.655112	\N
5	693f8d540a67720d23124b3a	Vô Địch Chỉ Với 1 Máu	vo-dich-chi-voi-1-mau		ongoing	vo-dich-chi-voi-1-mau-thumb.jpg	f	f	0	2026-02-14 16:22:51.572	2026-02-22 15:11:10.655112	\N
6	67d650c0a4a4a602fb8d30d3	Vật Giá Sụt Giảm, Triệu Phú Quay Về	vat-gia-sut-giam-trieu-phu-quay-ve	Vật Giá Sụt Giảm | Triệu Phú Quay Về	ongoing	vat-gia-sut-giam-trieu-phu-quay-ve-thumb.jpg	f	f	0	2026-02-14 16:22:41.417	2026-02-22 15:11:10.655112	\N
7	68d7831554ddf1823a6b8425	Tu Tiên Thần Tốc	tu-tien-than-toc	Tu Tiên Thần Tốc	ongoing	tu-tien-than-toc-thumb.jpg	f	f	0	2026-02-14 16:22:32.285	2026-02-22 15:11:10.655112	\N
8	68f46d34911ae532d4cfe064	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no	Trước Khi Em Có Ý Định Chạy Trốn Ta Sẽ Ngăn Chặn Nó	ongoing	truoc-khi-em-co-y-dinh-chay-tron-ta-se-ngan-chan-no-thumb.jpg	f	f	0	2026-02-14 16:22:22.33	2026-02-22 15:11:10.655112	\N
9	672da13d80217a7ba9bdc03d	Trụ Vương Tái Sinh Không Muốn Làm Đại Phản Diện	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien		ongoing	tru-vuong-tai-sinh-khong-muon-lam-dai-phan-dien-thumb.jpg	f	f	0	2026-02-14 16:22:14.368	2026-02-22 15:11:10.655112	\N
1	659380a910dc9c0a7e2e5d5a	Yêu Thần Ký	yeu-than-ky	Tales of Demons And Gods	ongoing	yeu-than-ky-thumb.jpg	f	t	1000	2026-02-14 16:23:28.689	2026-02-22 15:11:10.655112	\N
10	658cf3c310dc9c0a7e2e3ae0	Trở Thành Cô Vợ Khế Ước Của Nhân Vật Phản Diện	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien	Trở thành gia đình của nhân vật phản diện | Khế Ước Trở Thành Gia Đình Với Ác Ma	ongoing	tro-thanh-co-vo-khe-uoc-cua-nhan-vat-phan-dien-thumb.jpg	f	f	0	2026-02-14 16:22:07.091	2026-02-22 15:11:10.655112	\N
11	658e76bc68e54cf5b508fcb0	Tóm Lại Là Em Dễ Thương Được Chưa ?	tom-lai-la-em-de-thuong-duoc-chua		coming_soon	tom-lai-la-em-de-thuong-duoc-chua-thumb.jpg	f	f	0	2026-02-14 16:21:59.904	2026-02-22 15:11:10.655112	\N
12	6647947323b29ddd02834fb6	Tôi Thề Chúng Ta Chỉ Là Bạn	toi-the-chung-ta-chi-la-ban		ongoing	toi-the-chung-ta-chi-la-ban-thumb.jpg	f	f	0	2026-02-14 16:21:52.715	2026-02-22 15:11:10.655112	\N
13	6591202d10dc9c0a7e2e54fc	Tôi Mộng Giữa Ban Ngày	toi-mong-giua-ban-ngay	Ban Ngày Mơ Thấy Em	ongoing	toi-mong-giua-ban-ngay-thumb.jpg	f	f	0	2026-02-14 16:21:45.622	2026-02-22 15:11:10.655112	\N
14	689714b754ddf1823a633346	Tôi Dùng Hệ Thống Đỉnh Cấp Tái Tạo Thế Giới	toi-dung-he-thong-dinh-cap-tai-tao-the-gioi	Tôi Dùng Hệ Thống Đỉnh Cấp Tái Tạo Thế Giới	ongoing	toi-dung-he-thong-dinh-cap-tai-tao-the-gioi-thumb.jpg	f	f	0	2026-02-14 16:21:39.54	2026-02-22 15:11:10.655112	\N
15	65b1fef3fad3f557c4ead9a2	Tôi Cũng Muốn Làm Mợ Út	toi-cung-muon-lam-mo-ut		ongoing	toi-cung-muon-lam-mo-ut-thumb.jpg	f	f	0	2026-02-14 16:21:30.181	2026-02-22 15:11:10.655112	\N
16	697f228b679e2c7ab97066d1	Tôi Chuyển Sinh Thành Em Gái Chủ Mưu Trò Chơi Sinh Tử, Và Thất Bại Thảm Hại	toi-chuyen-sinh-thanh-em-gai-chu-muu-tro-choi-sinh-tu-va-that-bai-tham-hai	Tôi Chuyển Sinh Thành Em Gái Chủ Mưu Trò Chơi Sinh Tử | Và Thất Bại Thảm Hại	ongoing	toi-chuyen-sinh-thanh-em-gai-chu-muu-tro-choi-sinh-tu-va-that-bai-tham-hai-thumb.jpg	f	f	0	2026-02-14 16:21:23.592	2026-02-22 15:11:10.655112	\N
17	68384b6154ddf1823a4e45a3	Toàn Chức Kiếm Tu	toan-chuc-kiem-tu	Toàn Chức Kiếm Tu	ongoing	toan-chuc-kiem-tu-thumb.jpg	f	f	0	2026-02-14 16:21:15.258	2026-02-22 15:11:10.655112	\N
18	6584ff8a10dc9c0a7e2e0985	Tinh Võ Thần Quyết	tinh-vo-than-quyet		ongoing	tinh-vo-than-quyet-thumb.jpg	f	f	0	2026-02-14 16:21:09.436	2026-02-22 15:11:10.655112	\N
19	6598f44468e54cf5b50a2eb7	Tinh Tú Kiếm Sĩ	tinh-tu-kiem-si	Yểm Vân Kiếm Thánh	ongoing	tinh-tu-kiem-si-thumb.jpg	f	f	0	2026-02-14 16:21:02.185	2026-02-22 15:11:10.655112	\N
20	658f7d5410dc9c0a7e2e4cbb	Tinh Giáp Hồn Tướng	tinh-giap-hon-tuong	Huyền Thoại Tinh Giáp	ongoing	tinh-giap-hon-tuong-thumb.jpg	f	f	0	2026-02-14 16:20:55.821	2026-02-22 15:11:10.655112	\N
21	68ef67e7911ae532d4ced4dd	Tiên Vương Thú Liệp Pháp Tắc	tien-vuong-thu-liep-phap-tac	Tiên Vương Thú Liệp Pháp Tắc	ongoing	tien-vuong-thu-liep-phap-tac-thumb.jpg	f	f	0	2026-02-14 16:20:49.881	2026-02-22 15:11:10.655112	\N
22	659121cc10dc9c0a7e2e578c	Tiên Võ Đế Tôn	tien-vo-de-ton		ongoing	tien-vo-de-ton-thumb.jpg	f	f	0	2026-02-14 16:20:43.829	2026-02-22 15:11:10.655112	\N
23	670ba48580217a7ba9b8674e	Thuần Thú Sư Thiên Tài	thuan-thu-su-thien-tai		ongoing	thuan-thu-su-thien-tai-thumb.jpg	f	f	0	2026-02-14 16:20:37.227	2026-02-22 15:11:10.655112	\N
24	6598f56e68e54cf5b50a32ee	Thiếu Chủ Giỏi Chạy Trốn	thieu-chu-gioi-chay-tron	Waka là Nige jouzu no wakagimi | The Elusive Samurai | The Elusive Young Lord	ongoing	thieu-chu-gioi-chay-tron-thumb.jpg	f	f	0	2026-02-14 16:20:30.659	2026-02-22 15:11:10.655112	\N
218	65680cf710dc9c0a7e2d5af8	Yugo - Kẻ thương thuyết	yugo-ke-thuong-thuyet	Yugo Kẻ thương thuyết | Những Ngày Xanh | 勇午 | 勇午 パキスタン編 | 勇午 日本編 | Yugo Negotiator | Yugo the Negotiator | Yuugo	ongoing	yugo-ke-thuong-thuyet-thumb.jpg	f	f	0	2026-02-25 10:07:25.548	2026-02-25 21:29:31.815549	16
2	694cb4b40a67720d23170965	Xuyên Không Tới Tu Tiên Giới Làm Trù Thần	xuyen-khong-toi-tu-tien-gioi-lam-tru-than	Xuyên Không Tới Tu Tiên Giới Làm Trù Thần	ongoing	xuyen-khong-toi-tu-tien-gioi-lam-tru-than-thumb.jpg	f	f	0	2026-02-25 10:07:19.016	2026-02-22 15:11:10.655112	\N
221	69256445679e2c7ab9378e7b	Võ Đại Lang Mạnh Nhất Tái Sinh Ở Thế Giới Thủy Hử	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu		ongoing	vo-dai-lang-manh-nhat-tai-sinh-o-the-gioi-thuy-hu-thumb.jpg	f	f	0	2026-02-25 10:06:55.106	2026-02-25 21:29:31.815549	16
222	68d8e2c454ddf1823a6bd12c	Vĩ Nhân Kiếm	vi-nhan-kiem	Vĩ Nhân Kiếm	ongoing	vi-nhan-kiem-thumb.jpg	f	f	0	2026-02-25 10:06:46.003	2026-02-25 21:29:31.815549	16
223	659121e968e54cf5b5091426	Vạn Cổ Tối Cường Tông	van-co-toi-cuong-tong		ongoing	van-co-toi-cuong-tong-thumb.jpg	f	f	0	2026-02-25 10:06:38.916	2026-02-25 21:29:31.815549	16
224	67516df8a4a4a602fb797880	Tuyệt Đối Dân Cư	tuyet-doi-dan-cu	Tuyệt Đối Dân Cư	ongoing	tuyet-doi-dan-cu-thumb.jpg	f	f	0	2026-02-25 10:06:32.145	2026-02-25 21:29:31.815549	16
225	6874ffa654ddf1823a5e81bd	Tôi Trở Thành Em Vợ Út Của Các Nam Chính Trong Tiểu Thuyết Harem Ngược U Ám	toi-tro-thanh-em-vo-ut-cua-cac-nam-chinh-trong-tieu-thuyet-harem-nguoc-u-am	Tôi Trở Thành Em Vợ Út Của Các Nam Chính Trong Tiểu Thuyết Harem Ngược U Ám	ongoing	toi-tro-thanh-em-vo-ut-cua-cac-nam-chinh-trong-tieu-thuyet-harem-nguoc-u-am-thumb.jpg	f	f	0	2026-02-25 10:06:26.14	2026-02-25 21:29:31.815549	16
226	658cf42510dc9c0a7e2e3b53	Tôi Mạnh Hơn Anh Hùng	toi-manh-hon-anh-hung		ongoing	toi-manh-hon-anh-hung-thumb.jpg	f	f	0	2026-02-25 10:06:19.158	2026-02-25 21:29:31.815549	16
227	692902ea0a67720d23090486	Tôi Là Nông Dân Trồng Vong Linh	toi-la-nong-dan-trong-vong-linh		ongoing	toi-la-nong-dan-trong-vong-linh-thumb.jpg	f	f	0	2026-02-25 10:06:09.693	2026-02-25 21:29:31.815549	16
228	65bded1066b83f0711f381fe	Toàn Dân Chuyển Chức Ngự Long Sư Là Chức Nghiệp Yếu Nhất	toan-dan-chuyen-chuc-ngu-long-su-la-chuc-nghiep-yeu-nhat		ongoing	toan-dan-chuyen-chuc-ngu-long-su-la-chuc-nghiep-yeu-nhat-thumb.jpg	f	f	0	2026-02-25 10:06:03.737	2026-02-25 21:29:31.815549	16
229	658e77ca68e54cf5b508ff73	Toàn Cầu Cao Võ	toan-cau-cao-vo		coming_soon	toan-cau-cao-vo-thumb.jpg	f	f	0	2026-02-25 10:05:56.017	2026-02-25 21:29:31.815549	16
230	69842c110a67720d2340684b	Tinh Tế Bằng Không	tinh-te-bang-khong	Tinh Tế Bằng Không	ongoing	tinh-te-bang-khong-thumb.jpg	f	f	0	2026-02-25 10:05:49.414	2026-02-25 21:29:31.815549	16
231	693395a8679e2c7ab94297c2	Thương Hoàng Trở Về	thuong-hoang-tro-ve		ongoing	thuong-hoang-tro-ve-thumb.jpg	f	f	0	2026-02-25 10:05:42.306	2026-02-25 21:29:31.815549	16
232	68d8e2eb911ae532d4c9ecf4	Thức Tỉnh Toàn Chức	thuc-tinh-toan-chuc	Thức Tỉnh Toàn Chức | Toàn Năng Giác Tỉnh Sư	ongoing	thuc-tinh-toan-chuc-thumb.jpg	f	f	0	2026-02-25 10:05:36.266	2026-02-25 21:29:31.815549	16
233	682f0072911ae532d4aa8b8d	Thuần Hóa Munchkin	thuan-hoa-munchkin	Thuần Hóa Munchkin	ongoing	thuan-hoa-munchkin-thumb.jpg	f	f	0	2026-02-25 10:05:29.772	2026-02-25 21:29:31.815549	16
234	6897154a911ae532d4c1653d	Thiếu Nợ Quá Nhiều, Ta Bị Ép Trở Thành Người Làm Công Của Tà Thần	thieu-no-qua-nhieu-ta-bi-ep-tro-thanh-nguoi-lam-cong-cua-ta-than	Thiếu Nợ Quá Nhiều | Ta Bị Ép Trở Thành Người Làm Công Của Tà Thần	ongoing	thieu-no-qua-nhieu-ta-bi-ep-tro-thanh-nguoi-lam-cong-cua-ta-than-thumb.jpg	f	f	0	2026-02-25 10:05:20.017	2026-02-25 21:29:31.815549	16
235	67f9f96cbd508bf388809fef	Thiên Tài Nhìn Thấu Thế Giới	thien-tai-nhin-thau-the-gioi	Thiên Tài Nhìn Thấu Thế Giới	ongoing	thien-tai-nhin-thau-the-gioi-thumb.jpg	f	f	0	2026-02-25 10:05:11.087	2026-02-25 21:29:31.815549	16
236	66f3cd52b84a01eaefe714fb	Thiên Ma 3077	thien-ma-3077		ongoing	thien-ma-3077-thumb.jpg	f	f	0	2026-02-25 10:05:04.232	2026-02-25 21:29:31.815549	16
237	6950a2fa679e2c7ab94fc3d9	Thiên Hạ Ai Không Biết Quân	thien-ha-ai-khong-biet-quan	Thiên Hạ Ai Không Biết Quân	ongoing	thien-ha-ai-khong-biet-quan-thumb.jpg	f	f	0	2026-02-25 10:04:57.951	2026-02-25 21:29:31.815549	16
238	659382a168e54cf5b5091e0b	Thảm Họa Tử Linh Sư	tham-hoa-tu-linh-su	Tử Linh Pháp Sư: Ta Chính Là Thiên Tai	ongoing	tham-hoa-tu-linh-su-thumb.jpg	f	f	0	2026-02-25 10:04:51.777	2026-02-25 21:29:31.815549	16
239	688ef62f54ddf1823a61ecfb	Thái Cổ Thập Hung: Người Khác Ngự Thú Ta Ngự Thú Nương	thai-co-thap-hung-nguoi-khac-ngu-thu-ta-ngu-thu-nuong	Thái Cổ Thập Hung: Người Khác Ngự Thú Ta Ngự Thú Nương	ongoing	thai-co-thap-hung-nguoi-khac-ngu-thu-ta-ngu-thu-nuong-thumb.jpg	f	f	0	2026-02-25 10:04:44.14	2026-02-25 21:29:31.815549	16
240	6913fe5954ddf1823a7d7609	Thà Lấy Bài Vị Còn Hơn Làm Thiếp	tha-lay-bai-vi-con-hon-lam-thiep	Thà Lấy Bài Vị Còn Hơn Làm Thiếp	ongoing	tha-lay-bai-vi-con-hon-lam-thiep-thumb.jpg	f	f	0	2026-02-25 10:04:32.936	2026-02-25 21:29:31.815549	16
241	691bfee8911ae532d4de5dc1	Thà Gả Cho Người Đã Khuất Còn Hơn Làm Vợ Lẽ	tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le	Thà Gả Cho Người Đã Khuất Còn Hơn Làm Vợ Lẽ	ongoing	tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le-thumb.jpg	f	f	0	2026-02-25 10:04:26.719	2026-02-25 21:29:31.815549	16
\.


--
-- Data for Name: external_latest_chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.external_latest_chapters (comic_id, chapter_name, chapter_api_data, updated_at) FROM stdin;
1	669	https://sv1.otruyencdn.com/v1/api/chapter/69903df2e0d753f32e5870bb	2026-02-22 15:16:31.617459
218	73	https://sv1.otruyencdn.com/v1/api/chapter/699e6720e0d753f32e588909	2026-02-25 21:31:37.72871
3	8	https://sv1.otruyencdn.com/v1/api/chapter/69903df27b89b5b2570daf9b	2026-02-22 15:16:31.617459
4	20	https://sv1.otruyencdn.com/v1/api/chapter/69903dece0d753f32e5870af	2026-02-22 15:16:31.617459
5	11	https://sv1.otruyencdn.com/v1/api/chapter/69903deb7b89b5b2570daf7a	2026-02-22 15:16:31.617459
6	74	https://sv1.otruyencdn.com/v1/api/chapter/69903deae0d753f32e5870a9	2026-02-22 15:16:31.617459
7	58	https://sv1.otruyencdn.com/v1/api/chapter/69903de9e0d753f32e5870a0	2026-02-22 15:16:31.617459
8	43	https://sv1.otruyencdn.com/v1/api/chapter/69903de97b89b5b2570daf74	2026-02-22 15:16:31.617459
9	195	https://sv1.otruyencdn.com/v1/api/chapter/69903de7e0d753f32e587099	2026-02-22 15:16:31.617459
10	153	https://sv1.otruyencdn.com/v1/api/chapter/69903de5e0d753f32e587095	2026-02-22 15:16:31.617459
11	337	https://sv1.otruyencdn.com/v1/api/chapter/69903de4e0d753f32e58708e	2026-02-22 15:16:31.617459
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
2	58	https://sv1.otruyencdn.com/v1/api/chapter/699e66c6e0d753f32e588895	2026-02-25 21:31:37.72871
220	153	https://sv1.otruyencdn.com/v1/api/chapter/699e66c57b89b5b2570dcb45	2026-02-25 21:31:37.72871
221	32	https://sv1.otruyencdn.com/v1/api/chapter/699e669e7b89b5b2570dcb2a	2026-02-25 21:31:37.72871
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
240	33	https://sv1.otruyencdn.com/v1/api/chapter/699e65457b89b5b2570dca31	2026-02-25 21:31:37.72871
241	33	https://sv1.otruyencdn.com/v1/api/chapter/699e6503e0d753f32e58874a	2026-02-25 21:31:37.72871
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
1	1	16	NEW_COMIC	Tác giả bạn theo dõi vừa đăng truyện mới	🆕 Thà Gả Cho Người Đã Khuất Còn Hơn Làm Vợ Lẽ	/truyen/tha-ga-cho-nguoi-da-khuat-con-hon-lam-vo-le	2026-02-25 21:29:32.042301	2026-02-25 22:14:28.219444
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name) FROM stdin;
1	user	Ngu?i d—ng
2	admin	Qu?n tr?
\.


--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_follows (id, follower_id, followee_id, created_at) FROM stdin;
4	1	16	2026-02-24 23:34:24.247471
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, phone, provider, google_id, password_hash, role_id, status, created_at) FROM stdin;
3	thuanee	huynhduythuan68@gmail.com	0339 171 545	local	\N	$2b$10$WZ0xtMvSgnX8CrbUgzJki.tMrheW7pIr/q3kDISFtiAPQ2bAJCluq	1	1	2026-02-18 22:08:26.098319
16	admin1	lebalong1802@gmail.com	\N	local	\N	$2b$10$YiBlgYIe9K/VwEhYUxRKq.DtRA6gDvXL.k5rQz6eoXw505uYNxxTC	2	1	2026-02-20 21:52:50.218745
1	thuan	huynhduythuan668@gmail.com	0339 171 545	local	\N	$2b$10$NSoiK2NsFuNcEi6DvY.4o.PsRhy.Q7VHui0MUMoHZ8lKHoAFaf0bK	1	1	2026-02-18 22:05:11.401234
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallet_transactions (id, user_id, type, amount, note, created_at, order_id, trans_id, status) FROM stdin;
1	1	topup_momo	100000	MoMo topup pending	2026-02-21 21:12:44.508743	MOMO1771683164507	\N	pending
2	1	topup_momo	100000	MoMo topup pending	2026-02-21 21:19:00.115087	MOMO1771683540050	\N	pending
3	1	topup_momo	50000	MoMo topup pending	2026-02-21 21:23:36.275852	MOMO1771683816107	\N	pending
4	1	topup_momo	50000	MoMo topup pending	2026-02-21 21:30:22.487163	MOMO1771684222315	\N	pending
5	1	topup_momo	200000	MoMo topup pending	2026-02-21 21:52:32.413712	MOMO1771685552315	\N	pending
6	1	topup_momo	100000	MoMo return success transId=4681024800	2026-02-21 21:56:16.572091	MOMO1771685776492	4681024800	success
7	1	topup_momo	200000	MoMo topup pending	2026-02-21 21:59:10.655003	MOMO1771685950490	\N	pending
8	1	topup_momo	200000	MoMo return success transId=4681040308	2026-02-21 22:01:26.713373	MOMO1771686086619	4681040308	success
9	1	nạp tiền momo	500000	Thanh toán thành công	2026-02-21 22:32:23.519058	MOMO1771687943517	4681054233	success
10	16	nạp tiền momo	100000	Thanh toán thành công	2026-02-22 22:30:45.641052	MOMO1771774245640	4681931800	success
11	16	purchase	1000	Mua truyện: Yêu Thần Ký (yeu-than-ky)	2026-02-22 22:32:37.869666	\N	\N	success
12	1	purchase	-1000	Mua truyện: Yêu Thần Ký (yeu-than-ky)	2026-02-22 22:44:32.612959	\N	\N	success
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (user_id, balance, updated_at) FROM stdin;
3	0	2026-02-18 22:08:26.098319
16	99000	2026-02-22 22:32:37.869666
1	799000	2026-02-22 22:44:32.612959
\.


--
-- Name: chapter_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_comments_id_seq', 14, true);


--
-- Name: chapter_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapter_reactions_id_seq', 6, true);


--
-- Name: comic_purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_purchases_id_seq', 2, true);


--
-- Name: comic_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comic_ratings_id_seq', 6, true);


--
-- Name: external_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_categories_id_seq', 567, true);


--
-- Name: external_comics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.external_comics_id_seq', 265, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 23, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- Name: user_follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_follows_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 12, true);


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
-- Name: comic_purchases comic_purchases_user_id_comic_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_purchases
    ADD CONSTRAINT comic_purchases_user_id_comic_slug_key UNIQUE (user_id, comic_slug);


--
-- Name: comic_ratings comic_ratings_comic_slug_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings
    ADD CONSTRAINT comic_ratings_comic_slug_user_id_key UNIQUE (comic_slug, user_id);


--
-- Name: comic_ratings comic_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comic_ratings
    ADD CONSTRAINT comic_ratings_pkey PRIMARY KEY (id);


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
-- Name: idx_chapter_comments_chapter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_comments_chapter_id ON public.chapter_comments USING btree (chapter_id);


--
-- Name: idx_chapter_comments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_comments_parent_id ON public.chapter_comments USING btree (parent_id);


--
-- Name: idx_chapter_reactions_chapter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_reactions_chapter_id ON public.chapter_reactions USING btree (chapter_id);


--
-- Name: idx_comic_purchases_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comic_purchases_user ON public.comic_purchases USING btree (user_id);


--
-- Name: idx_comic_ratings_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comic_ratings_slug ON public.comic_ratings USING btree (comic_slug);


--
-- Name: idx_notif_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_user_follows_followee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_follows_followee ON public.user_follows USING btree (followee_id);


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

\unrestrict tOaBS7Ur96dFeGjka4PV0dn87BbyMWbGvZYFo8IlMALkTS7VKW6fTf8bIWmjEuj

