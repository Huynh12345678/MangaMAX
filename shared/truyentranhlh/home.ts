import instance from "../axios";
import { parse } from "node-html-parser";
import { store } from "../../store";

const getHome = async (page: number = 1): Promise<any> => {
    const state = store.getState();

    const handleSource = () => {
        if (state.type === 'browse') {
            return `danh-sach?sort=new&page=${page}`
        } else {
            return `danh-sach?sort=update&page=${page}`
        }
    }

    const handleData = () => {
        return htmls.map((source, index) => {
            const dom = parse(source);

            const items = dom.querySelectorAll(".col-md-8 > .card > .card-body > .row .thumb-item-flow").map((item) => ({
                title: item.querySelector(".series-title > a")?.innerText,
                cover: item.querySelector(".a6-ratio > div.img-in-ratio")?.getAttribute("data-bg"),
                chapter: item.querySelector(".thumb-detail > div > a")?.innerText ?? '',
                slug: item
                    .querySelector(".series-title > a")
                    ?.getAttribute("href")
                    ?.split("/")
                    .slice(-1)[0],
                updateAt: item.querySelector("time.timeago")?.getAttribute("datetime"),
            }));

            const pages = [];
            for (const page of [...dom.querySelectorAll(".pagination_wrap a")]) {
                const p = Number(page?.innerText.trim());
                if (isNaN(p)) continue;
                pages.push(p);
            }
            const lastPage = Math.max(...pages);
            const hasNextPage = (+page) !== lastPage;
            const currentPage = (+dom.querySelector(".pagination_wrap > a.current")?.innerText!);

            return {
                name: Object.keys(sections)[index],
                items,
                hasNextPage,
                currentPage
            };
        });
    }

    const sections = {
        "Truyện": handleSource()
    }

    const htmls = await Promise.all(
        Object.entries(sections).map(([_, value]) => value).map(async (url) => (await instance.get(url)).data)
    )

    const data = handleData();

    return data;

};

export default getHome;