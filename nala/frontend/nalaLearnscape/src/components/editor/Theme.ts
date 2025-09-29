/* eslint-disable import/no-anonymous-default-export */
export default {
  code: 'bg-[#cddcf7] rounded px-1 py-0.5 font-mono text-sm text-[#0c1e4a]',
  heading: {
    h1: 'text-3xl font-bold text-[#004aad] mb-4 font-["Fredoka"]',
    h2: 'text-2xl font-bold text-[#004aad] mb-3 font-["Fredoka"]',
    h3: 'text-xl font-bold text-[#004aad] mb-2 font-["Fredoka"]',
    h4: 'text-lg font-semibold text-[#0c1e4a] mb-2 font-["Fredoka"]',
    h5: 'text-base font-semibold text-[#0c1e4a] mb-1',
  },
  image: 'max-w-full h-auto',
  link: 'text-[#004aad] underline hover:text-[#0c1e4a] cursor-pointer transition-colors',
  list: {
    listitem: 'ml-8 my-1',
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-4',
    ul: 'list-disc ml-4',
  },
  ltr: 'text-left',
  paragraph: 'mb-3 text-[#0c1e4a] leading-relaxed font-["GlacialIndifference",sans-serif]',
  placeholder: 'text-gray-400 absolute top-4 left-4 pointer-events-none font-["GlacialIndifference",sans-serif]',
  quote: 'border-l-4 border-[#004aad] pl-4 italic text-gray-700 my-4 bg-[#cddcf7]/30 py-2',
  rtl: 'text-right',
  text: {
    bold: 'font-bold',
    code: 'bg-[#cddcf7] rounded px-1 py-0.5 font-mono text-sm',
    hashtag: 'text-[#004aad] font-semibold',
    italic: 'italic',
    overflowed: 'truncate',
    strikethrough: 'line-through',
    underline: 'underline',
    underlineStrikethrough: 'underline line-through',
  },
};