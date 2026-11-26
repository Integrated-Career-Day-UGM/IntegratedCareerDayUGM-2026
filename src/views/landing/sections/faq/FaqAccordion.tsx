'use client';

import { Fragment } from 'react';
import { ShapeProvider } from '@/lib/shape-context';
import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './components';
import type { FaqItem } from './data';

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <ShapeProvider defaultShape="sharp">
      <AccordionGroup
        type="single"
        collapsible
        size="default"
        defaultValue={items[0]?.value}
        className="faq-figma flex w-full flex-col gap-2"
      >
        {items.map((item, index) => (
          <Fragment key={item.value}>
            <div className="faq-divider" aria-hidden="true" />
            <AccordionItem
              value={item.value}
              index={index}
              className="w-full bg-[#7898ff] data-[open]:bg-[#486bda]"
            >
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          </Fragment>
        ))}
      </AccordionGroup>
    </ShapeProvider>
  );
}
