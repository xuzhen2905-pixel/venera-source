/** @type {import('./_venera_.js')} */

class NewComicSource extends ComicSource {
    name = "810114 漫画源"
    key = "ex_810114_xyz"
    version = "1.0.0"
    minAppVersion = "1.6.0"
    url = "https://ex.810114.xyz/"

    init() {
        console.log("810114 漫画源初始化成功");
    }

    explore = [
        {
            title: "首页推荐",
            type: "multiPartPage",
            load: async (page) => {
                let res = await Network.get("https://ex.810114.xyz/");
                if (res.status !== 200) throw `状态码异常: ${res.status}`;

                let doc = new HtmlDocument(res.body);
                let result = [];
                try {
                    // 1. 解析热门推荐板块（请将下面的选择器替换为真实的网页类名）
                    let hotElements = doc.querySelectorAll(".hot-comics-selector"); 
                    let hotComics = hotElements.map(el => new Comic({
                        id: el.querySelector("a").attributes["href"] || "", 
                        title: el.querySelector(".title-selector").text.trim(),
                        subTitle: el.querySelector(".author-selector")?.text.trim() || "",
                        cover: el.querySelector("img").attributes["src"] || ""
                    }));
                    
                    if (hotComics.length > 0) {
                        result.push({ title: "热门推荐", comics: hotComics });
                    }
                } finally {
                    doc.dispose(); // 核心内存释放
                }
                return result;
            }
        }
    ];

    comic = {
        loadInfo: async (id) => {
            let targetUrl = id.startsWith("http") ? id : `https://ex.810114.xyz${id}`;
            let res = await Network.get(targetUrl);
            let doc = new HtmlDocument(res.body);
            try {
                // 自动映射漫画名、封面图、描述与章节列表
                let chapters = {};
                doc.querySelectorAll(".chapter-link-selector").forEach(el => {
                    chapters[el.attributes["href"] || ""] = el.text.trim();
                });
                return new ComicDetails({
                    title: doc.querySelector(".comic-title-selector").text.trim(),
                    cover: doc.querySelector(".comic-cover-selector").attributes["src"] || "",
                    description: doc.querySelector(".comic-desc-selector")?.text.trim() || "",
                    chapters: chapters
                });
            } finally {
                doc.dispose();
            }
        },
        loadEp: async (comicId, epId) => {
            let targetUrl = epId.startsWith("http") ? epId : `https://ex.810114.xyz${epId}`;
            let res = await Network.get(targetUrl);
            let doc = new HtmlDocument(res.body);
            try {
                // 解析每一页的漫画图片链接
                let images = doc.querySelectorAll(".reader-image-selector img").map(el => 
                    el.attributes["src"] || el.attributes["data-src"] || ""
                ).filter(url => url !== "");
                return { images: images };
            } finally {
                doc.dispose();
            }
        }
    };
}

// 注入框架容器
ComicSource.sources["ex_810114_xyz"] = new NewComicSource();
