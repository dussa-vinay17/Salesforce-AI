public with sharing class OpenAIService {

    @AuraEnabled(cacheable=false)
    public static String getAIResponse(String userQuery) {

        Http http = new Http();
        HttpRequest req = new HttpRequest();

        req.setEndpoint('callout:OpenAI_API/v1/chat/completions');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        // ChatGPT Request Body
        String body = JSON.serialize(new Map<String, Object>{
            'model' => 'gpt-4o-mini',
            'messages' => new List<Object>{
                new Map<String, Object>{
                    'role' => 'user',
                    'content' => userQuery
                }
            },
            'max_tokens' => 300
        });

        req.setBody(body);

        HttpResponse res = http.send(req);

        System.debug('🔵 OpenAI Response → ' + res.getBody());

        if (res.getStatusCode() != 200) {
            return '❌ OpenAI Error: ' + res.getBody();
        }

        // Parse JSON
        Map<String, Object> jsonResult =
            (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

        List<Object> choices = (List<Object>) jsonResult.get('choices');

        if (!choices.isEmpty()) {
            Map<String, Object> firstChoice = (Map<String, Object>) choices[0];
            Map<String, Object> message = (Map<String, Object>) firstChoice.get('message');
            return (String) message.get('content');
        }

        return '⚠ No response from ChatGPT.';
    }
}
