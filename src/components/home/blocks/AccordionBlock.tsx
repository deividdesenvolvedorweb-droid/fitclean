import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AccordionBlockProps {
  config: Record<string, any>;
}

export function AccordionBlock({ config }: AccordionBlockProps) {
  const items: { title: string; content: string }[] = config.items || [
    { title: "Item 1", content: "Conteúdo do item 1" },
  ];
  const iconColor = config.icon_color;
  const titleColor = config.title_color;
  const contentColor = config.content_color;

  return (
    <div className="py-4">
      {config.heading && (
        <h3 className="text-xl font-bold mb-4" style={{ color: titleColor || undefined }}>
          {config.heading}
        </h3>
      )}
      <Accordion type={config.multiple ? "multiple" : "single"} collapsible className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`item-${idx}`}>
            <AccordionTrigger
              className="text-left"
              style={{ color: titleColor || undefined }}
            >
              {item.title}
            </AccordionTrigger>
            <AccordionContent style={{ color: contentColor || undefined }}>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
