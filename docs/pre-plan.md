##### SIGN_UP

```json
{
    "userId": "string:unique:[email,uniqueId,mobileNo]",
    "password": "string:alpha:numeric",
    "verified": "boolean"
}

```

##### SIGN_IN
```json
{
    "userId": "string:unique:[email,uniqueId,mobileNo]",
    "password": "string:alpha:numeric"
}
```

##### PLAY_GAME
```json
{
    "userId": "string",
    "entryFee": "optional"
}
```