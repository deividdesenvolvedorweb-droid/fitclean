import { BannerSliderBlock } from "./blocks/BannerSliderBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { ProductsBlock } from "./blocks/ProductsBlock";
import { CategoriesBlock } from "./blocks/CategoriesBlock";
import { SpacerBlock } from "./blocks/SpacerBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { ContainerBlock } from "./blocks/ContainerBlock";
import { IconBoxBlock } from "./blocks/IconBoxBlock";
import { SocialIconsBlock } from "./blocks/SocialIconsBlock";
import { ImageCarouselBlock } from "./blocks/ImageCarouselBlock";
import { VideoCarouselBlock } from "./blocks/VideoCarouselBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ButtonBlock } from "./blocks/ButtonBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { AccordionBlock } from "./blocks/AccordionBlock";
import { TabsBlock } from "./blocks/TabsBlock";
import { CountdownBlock } from "./blocks/CountdownBlock";
import { SectionBlock } from "./blocks/SectionBlock";
import { buildBlockStyle, buildBlockClasses, buildResponsiveCss } from "@/lib/blockStyles";

interface Block {
  id: string;
  type: string;
  config: Record<string, any>;
}

export function BlockRenderer({ block }: { block: Block }) {
  const style = buildBlockStyle(block.config || {});
  const classes = buildBlockClasses(block.config || {});
  const blockCls = `bl-${block.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`;
  const responsiveCss = buildResponsiveCss(blockCls, block.config || {});
  const hasWrapper = Object.keys(style).length > 0 || classes || responsiveCss;

  const content = (() => {
    switch (block.type) {
      case "banner_slider":
        return <BannerSliderBlock />;
      case "text":
        return <TextBlock config={block.config} />;
      case "image":
        return <ImageBlock config={block.config} />;
      case "products":
        return <ProductsBlock config={block.config} />;
      case "categories":
        return <CategoriesBlock config={block.config} />;
      case "spacer":
        return <SpacerBlock config={block.config} />;
      case "video":
        return <VideoBlock config={block.config} />;
      case "container":
        return <ContainerBlock config={block.config} />;
      case "icon_box":
        return <IconBoxBlock config={block.config} />;
      case "social_icons":
        return <SocialIconsBlock config={block.config} />;
      case "image_carousel":
        return <ImageCarouselBlock config={block.config} />;
      case "video_carousel":
        return <VideoCarouselBlock config={block.config} />;
      case "heading":
        return <HeadingBlock config={block.config} />;
      case "button":
        return <ButtonBlock config={block.config} />;
      case "divider":
        return <DividerBlock config={block.config} />;
      case "accordion":
        return <AccordionBlock config={block.config} />;
      case "tabs":
        return <TabsBlock config={block.config} />;
      case "countdown":
        return <CountdownBlock config={block.config} />;
      case "section":
        return <SectionBlock config={block.config} />;
      default:
        return null;
    }
  })();

  if (hasWrapper) {
    return (
      <>
        {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
        <div style={style} className={`${blockCls} ${classes}`.trim()}>
          {content}
        </div>
      </>
    );
  }

  return content;
}
