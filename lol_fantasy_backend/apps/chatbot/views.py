import ollama
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChatMessage
from .serializers import ChatMessageSerializer

SYSTEM_PROMPT = """Tu es un assistant expert de LoL Fantasy League, une plateforme de fantasy esports basée sur League of Legends.

Règles du jeu :
- Le joueur rejoint une ligue (publique ou privée avec code d'invitation)
- Il compose un roster de 5 joueurs pros : 1 Top, 1 Jungle, 1 Mid, 1 ADC, 1 Support
- Budget de départ : 100 crédits — chaque joueur a un prix
- 1 capitaine désigné → ses points sont multipliés par 1.5
- Chaque semaine, les joueurs marquent des points selon leurs vraies performances en LEC/LCK/LCS/LPL

Système de points :
- Kill → +3 pts | Mort → -1 pt | Assist → +1.5 pts
- CS/min ≥ 10 → +2 pts | ≥ 8 → +1 pt
- KDA ≥ 10 → +5 pts | ≥ 5 → +2 pts | ≥ 3 → +1 pt
- Victoire → +2 pts | Capitaine → × 1.5 sur tous ses points

Pronostics : avant chaque match, prédit le gagnant → correct = +5 pts bonus

Championnats couverts : LEC (Europe), LCK (Corée), LCS (Amérique du Nord), LPL (Chine)

Joueurs stars notables : Faker (T1 - Mid), Caps (G2 - Mid), Chovy (Gen.G - Mid), Ruler (Gen.G - ADC), Canyon (Gen.G - Jungle)

Réponds toujours en français, de façon claire et concise. Si la question ne concerne pas LoL Fantasy League, redirige poliment vers le sujet."""

OLLAMA_MODEL = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:3b')


def get_bot_response(message: str, history: list) -> str:
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for entry in history:
        messages.append({'role': 'user', 'content': entry['message']})
        messages.append({'role': 'assistant', 'content': entry['response']})
    messages.append({'role': 'user', 'content': message})

    try:
        result = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        return result.message.content
    except Exception as e:
        return (
            f"🤖 Je suis temporairement indisponible (Ollama: {e}). "
            "Vérifie qu'Ollama est lancé avec le modèle requis."
        )


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message vide.'}, status=400)

        recent = list(
            ChatMessage.objects.filter(user=request.user)
            .order_by('-created_at')[:6]
            .values('message', 'response')
        )
        history = list(reversed(recent))

        response = get_bot_response(message, history)
        chat = ChatMessage.objects.create(
            user=request.user, message=message, response=response
        )
        return Response(ChatMessageSerializer(chat).data, status=201)

    def get(self, request):
        history = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:50]
        return Response(ChatMessageSerializer(history, many=True).data)
