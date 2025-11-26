import requests

api_key = "AIzaSyB7K5tE6BXM0ZreQSifXHjjsutUoNPi7aI"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
print(response.json())