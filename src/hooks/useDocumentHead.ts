import { useEffect } from "react";

interface DocumentHeadOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

function setMetaTag(property: string, content: string, isOg = false) {
  const attr = isOg ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function useDocumentHead({ title, description, ogImage, ogType, canonical }: DocumentHeadOptions) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMetaTag("og:title", title, true);
      setMetaTag("twitter:title", title);
    }
    if (description) {
      setMetaTag("description", description);
      setMetaTag("og:description", description, true);
      setMetaTag("twitter:description", description);
    }
    if (ogImage) {
      setMetaTag("og:image", ogImage, true);
      setMetaTag("twitter:image", ogImage);
      setMetaTag("twitter:card", "summary_large_image");
    }
    if (ogType) {
      setMetaTag("og:type", ogType, true);
    }
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, ogImage, ogType, canonical]);
}
