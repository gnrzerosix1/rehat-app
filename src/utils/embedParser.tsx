import React from 'react';

export const renderContentWithEmbeds = (content: string, textClassName: string = "whitespace-pre-wrap font-mono text-sm md:text-base") => {
  if (!content) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  const embeds: JSX.Element[] = [];

  const formattedText = parts.map((part, i) => {
    if (part.match(urlRegex)) {
      // Check if YouTube
      const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch && ytMatch[1]) {
        embeds.push(
          <div key={`yt-${i}`} className="mt-4 relative w-full pt-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full border-2 border-black brutal-shadow-sm"
              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
      
      // Check if Facebook
      const fbMatch = part.match(/(?:facebook\.com\/(?:watch\/?\?v=|.*\/videos\/)|fb\.watch\/)/i);
      if (fbMatch) {
        embeds.push(
          <div key={`fb-${i}`} className="mt-4 relative w-full pt-[56.25%] overflow-hidden border-2 border-black brutal-shadow-sm bg-black">
            <iframe
              src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(part)}&show_text=false&width=auto`}
              className="absolute top-0 left-0 w-full h-full border-none overflow-hidden"
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>
          </div>
        );
      }

      // Check if Image
      const imgMatch = part.match(/\.(jpeg|jpg|gif|png|webp)(?:\?.*)?$/i);
      if (imgMatch) {
        embeds.push(
          <div key={`img-${i}`} className="mt-4 w-full">
            <img
              src={part}
              alt="Embedded content"
              className="w-full h-auto border-2 border-black brutal-shadow-sm object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        );
      }

      // Check if TikTok
      const tiktokMatch = part.match(/tiktok\.com\/@[a-zA-Z0-9_.-]+\/video\/(\d+)/i);
      if (tiktokMatch && tiktokMatch[1]) {
        embeds.push(
          <div key={`tiktok-${i}`} className="mt-4 w-full flex justify-center bg-black border-2 border-black brutal-shadow-sm overflow-hidden rounded-md">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`}
              className="w-full max-w-[325px] h-[600px] border-none"
              allowFullScreen
              scrolling="no"
              allow="encrypted-media;"
            ></iframe>
          </div>
        );
      }

      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:bg-black hover:text-white transition-colors break-all">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });

  return (
    <div className="w-full">
      <p className={textClassName}>{formattedText}</p>
      {embeds.length > 0 && <div className="mt-3 flex flex-col gap-4">{embeds}</div>}
    </div>
  );
};
