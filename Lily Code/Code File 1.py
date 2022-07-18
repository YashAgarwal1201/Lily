"""
Language Detection & Translation
"""

#   imports
import pyttsx3
import speech_recognition as speech
from langdetect import detect, DetectorFactory
from googletrans import Translator
#from textblob import TextBlob
#import langid

#text = "Hola. It was a beautiful day ."
#print(langid.classify(text))



engine = pyttsx3.init('sapi5')
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[0].id)
engine.setProperty('rate', 150)

DetectorFactory.seed = 0
translator = Translator()

#   Speak Function
def speak(audio):
    engine.say(audio)
    print('Bot: ',audio)
    engine.runAndWait()

#   Function to take Input from User
def takeQuery():
    r = speech.Recognizer()
    with speech.Microphone() as source:
        print("Listening...")
        r.energy_threshold = 1000
        r.pause_threshold = 1
        audio = r.listen(source, timeout = 10, phrase_time_limit = 10)

    try:
        print("Recognizing...")    
        query = r.recognize_google(audio, language='en-in')
        print(f"User said: {query}\n")
    except Exception as e:
        speak("Say that again please...")
        query = takeQuery.lower()
    return query

#   Language Detection Function
def langDetect(lang):
    inputLang = detect(lang)
    return inputLang

#   Language Translation Function
def langTrans(lsrc, text):
    lang2 = translator.translate(text, src = lsrc, dest = 'es')
    speak(lang2.text)

#   Main Function
def main():
    speak("Hello there! Say something...")
    lang = takeQuery()
    langSrc = langDetect(lang)
    print(langSrc)
    langTrans(langSrc, lang)
    pass

#   Calling Main Function
if __name__ == "__main__":
    main()
