import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsBlockProps {
  config: Record<string, any>;
}

export function TabsBlock({ config }: TabsBlockProps) {
  const items: { title: string; content: string }[] = config.items || [
    { title: "Tab 1", content: "Conteúdo da tab 1" },
    { title: "Tab 2", content: "Conteúdo da tab 2" },
  ];

  return (
    <div className="py-4">
      {config.heading && <h3 className="text-xl font-bold mb-4">{config.heading}</h3>}
      <Tabs defaultValue="tab-0" className="w-full">
        <TabsList className="w-full justify-start">
          {items.map((item, idx) => (
            <TabsTrigger key={idx} value={`tab-${idx}`}>
              {item.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, idx) => (
          <TabsContent key={idx} value={`tab-${idx}`} className="mt-4">
            <p>{item.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
