import logging
from typing import Optional

from app.core.config import settings
from app.api.schemas import RewriteResponse, RewriteOptions

logger = logging.getLogger(__name__)

async def rewrite_text(
    transcript: str,
    profile: str,
    options: Optional[RewriteOptions] = None
) -> RewriteResponse:
    """
    Rewrite text according to specified profile using OpenAI
    
    Args:
        transcript: Text to rewrite
        profile: Rewriting profile/style
        options: Rewriting options
        
    Returns:
        RewriteResponse with rewritten text
    """
    logger.info(f"Rewriting text with profile: {profile}")
    
    # Use default options if none provided
    if options is None:
        options = RewriteOptions()
    
    # Use OpenAI for rewriting
    result = await rewrite_with_openai(transcript, profile, options)
    return result

async def rewrite_with_openai(
    transcript: str,
    profile: str,
    options: RewriteOptions
) -> RewriteResponse:
    """
    Rewrite text using OpenAI
    
    Args:
        transcript: Text to rewrite
        profile: Rewriting profile/style
        options: Rewriting options
        
    Returns:
        RewriteResponse with rewritten text
    """
    try:
        from openai import AsyncOpenAI
        
        # Set API key
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set")
        
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create system prompt based on profile
        system_prompt = get_system_prompt_for_profile(profile)
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=options.temperature,
            max_tokens=options.max_tokens or 2000
        )
        
        # Extract rewritten text
        rewritten_text = response.choices[0].message.content
        
        return RewriteResponse(text=rewritten_text)
    except ImportError:
        logger.error("OpenAI package not installed")
        raise ImportError("Please install openai package: pip install openai")
    except Exception as e:
        logger.error(f"OpenAI rewriting error: {e}")
        raise Exception(f"Failed to rewrite with OpenAI: {e}")


def get_system_prompt_for_profile(profile: str) -> str:
    """
    Get system prompt for rewriting based on profile
    
    Args:
        profile: Rewriting profile/style
        
    Returns:
        System prompt for the LLM
    """
    prompts = {
        "professional": """
            You are an expert editor specializing in professional communication.
            Rewrite the provided text to be clear, concise, and professional.
            Use formal language, remove filler words, and organize ideas logically.
            Maintain the original meaning and key points while improving clarity and professionalism.
        """,
        "casual": """
            You are a conversational editor who specializes in casual, friendly communication.
            Rewrite the provided text to sound natural, approachable, and conversational.
            Use everyday language, contractions, and a friendly tone.
            Maintain the original meaning while making it sound like a casual conversation.
        """,
        "academic": """
            You are an academic editor with expertise in scholarly writing.
            Rewrite the provided text using formal academic language and structure.
            Use precise terminology, third-person perspective, and evidence-based statements.
            Organize content logically with clear topic sentences and transitions.
            Maintain the original meaning while elevating the academic quality.
        """,
        "creative": """
            You are a creative writing expert with a flair for engaging storytelling.
            Rewrite the provided text to be more vivid, descriptive, and engaging.
            Use imagery, varied sentence structure, and evocative language.
            Maintain the original meaning while making it more captivating and memorable.
        """,
        "technical": """
            You are a technical writer specializing in clear, precise documentation.
            Rewrite the provided text to be technically accurate, structured, and unambiguous.
            Use industry-standard terminology, logical organization, and concise explanations.
            Maintain the original meaning while improving clarity for technical audiences.
        """,
        "simplified": """
            You are an editor specializing in simplified language and accessibility.
            Rewrite the provided text to be easily understood by a wide audience.
            Use simple words, short sentences, and clear explanations.
            Avoid jargon, complex structures, and ambiguity.
            Maintain the original meaning while making it accessible to readers at approximately a 6th-grade reading level.
        """
    }
    
    return prompts.get(profile.lower(), prompts["professional"])
