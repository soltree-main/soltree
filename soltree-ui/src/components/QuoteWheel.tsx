import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

const SECOND = 1000;
const DURATION = 15;

const QUOTE_CHANGE_INTERVAL = DURATION * SECOND;

const getRandomIndex = (listLength: number): number => Math.floor(Math.random() * listLength);

const quotes = ['"If I cannot do great things, I can do small things in a great way." - Dr. Martin Luther King Jr',
    '“You never change things by fighting against the existing reality. To change something, build a new model that makes the old model obsolete.” - Buckminster Fuller',
    '“Until we are all free, we are none of us free.” - Emma Lazarus',
    '"Science doesn\'t have a box" -Peter Joseph'];

export default function QuoteWheel(): ReactElement {
    const [currentQuote, setCurrentQuote] = useState<string>('');

    const selectNextQuote = useCallback((): string => {
        const reducedQuotesList = quotes.filter((quote) => currentQuote !== quote)
        const index = getRandomIndex(reducedQuotesList.length);

        return reducedQuotesList[index];
    }, [currentQuote])

    useEffect(() => {
        if (currentQuote === '') {
            setCurrentQuote(selectNextQuote());

        }
        const changeQuote = setInterval(() => {
            setCurrentQuote(selectNextQuote());
        }, QUOTE_CHANGE_INTERVAL);

        return () => clearInterval(changeQuote);
    }, [currentQuote, selectNextQuote]);

    return (
        <p className='text-primary-orange text-2xl'>{currentQuote}</p>
    )
}