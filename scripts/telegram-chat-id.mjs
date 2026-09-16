import process from 'node:process';

if (!process.stdin.isTTY) {
  console.error('터미널에서 실행해 주세요.');
  process.exit(1);
}

function hiddenInput() {
  return new Promise((resolve, reject) => {
    let value = '';
    const input = process.stdin;
    process.stdout.write('Telegram bot token (입력 내용 숨김): ');
    input.setRawMode(true);
    input.resume();
    const finish = (error) => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value.trim());
    };
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === '\u0003') return finish(new Error('취소했습니다.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    input.on('data', onData);
  });
}

try {
  const token = await hiddenInput();
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error('토큰 형식을 확인해 주세요.');
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { signal: AbortSignal.timeout(10000) });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error('봇 정보를 읽지 못했습니다.');
  const chats = payload.result.flatMap((update) => [update.message?.chat, update.edited_message?.chat].filter(Boolean));
  const privateChat = chats.findLast((chat) => chat.type === 'private');
  if (!privateChat) throw new Error('봇에게 먼저 /start를 보내고 다시 실행해 주세요.');
  console.log(`개인 채팅 ID: ${privateChat.id}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : '채팅 ID를 확인하지 못했습니다.');
  process.exitCode = 1;
}
