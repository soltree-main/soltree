import type { ReactElement } from "react";

// eslint-disable-next-line unicorn/prevent-abbreviations
interface ParagraphTextProps {
    text: string;
}

// eslint-disable-next-line unicorn/prevent-abbreviations
interface SectionTextProps {
    heading: string | undefined;
    paragraphs: string[];
}

function ParagraphText({ text }: ParagraphTextProps): ReactElement {
    return (
        <p className='text-essay-violet text-xl mb-8'>{text}</p>
    )
}

export default function SectionText({ heading, paragraphs }: SectionTextProps): ReactElement {
    return (
        <section className=''>
            {heading !== undefined && <h2 className='text-essay-violet text-3xl italic mb-4'>{heading}</h2>}
            {paragraphs.map((paragraph, index) => {
                const key = paragraph.charAt(0) + index.toString()
                return (
                    <ParagraphText key={key} text={paragraph} />
                )
            })}
        </section>)
}