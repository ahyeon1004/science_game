#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null; then
  print 'Node.js가 필요해요. https://nodejs.org 에서 LTS 버전을 설치해주세요.'
  read -r '?Enter를 누르면 닫힙니다.'
  exit 1
fi
print '브라우저에서 http://localhost:8767 을 열어주세요.'
print '같은 Wi-Fi 친구는 이 Mac의 IP 주소에 :8767 을 붙여 접속할 수 있어요.'
node server/game-server.cjs
