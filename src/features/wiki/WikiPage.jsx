import { useState } from "react";
import { WikiArticleView } from "./WikiArticleView.jsx";
import { WikiCategoryView } from "./WikiCategoryView.jsx";
import { WikiHomeView } from "./WikiHomeView.jsx";
import { loadAdminData } from "../../services/adminData.js";

function WikiPage({ dark, setActive }) {
  const data = loadAdminData();
  const categories = data.wikiCategories || [];
  const articles = (data.wikiArticles || []).filter(a => a.published);

  const [view, setView] = useState("home"); // home | category | article
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeArticleId, setActiveArticleId] = useState(null);

  const openArticle = (id) => { setActiveArticleId(id); setView("article"); };
  const openCategory = (id) => { setActiveCategoryId(id); setView("category"); };
  const goHome = () => setView("home");

  if (view === "article") {
    const article = articles.find(a => a.id === activeArticleId);
    if (!article) return <div style={{ color: "#888" }}>Article not found. <button onClick={goHome} style={{ color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>← Back to ChessWiki</button></div>;
    return <WikiArticleView article={article} articles={articles} categories={categories} data={data} dark={dark}
      onBack={() => activeCategoryId ? setView("category") : goHome()} onOpenArticle={openArticle} setActive={setActive} />;
  }
  if (view === "category") {
    const category = categories.find(c => c.id === activeCategoryId);
    const list = articles.filter(a => a.categoryId === activeCategoryId);
    return <WikiCategoryView category={category} articles={list} dark={dark} onBack={goHome} onOpenArticle={openArticle} />;
  }
  return <WikiHomeView categories={categories} articles={articles} dark={dark} onOpenArticle={openArticle} onOpenCategory={openCategory} />;
}

export {
  WikiPage,
};
