import { PlayerCard } from "shared/entities/player/player-card"
import { PlayerInventory } from "shared/entities/player/player-inventory"
import { PlayerKeySettings } from "shared/entities/player/player-key-settings"
import { PlayerSettings } from "shared/entities/player/player-settings"
import { PlayerState } from "shared/entities/player/player-state"

const players = new Array<PlayerState>()
class Database
{
    private database: GlobalDataStore
    private cache: { [key: string]: any; }
    constructor(newName?: string)
    {
        let name = newName ?? ("11-02-2021.A.1")
        this.database = game.GetService("DataStoreService").GetDataStore(name)
        this.cache = {}
    }
    GetObject<T>(key: string, cache?: boolean)
    {
        cache = cache ?? true
        if(cache && this.cache[key] !== undefined)
        {
            return this.cache[key] as T
        }
        return this.database.GetAsync(key) as T
    }
    SaveObject(key: string, value: any)
    {
        this.cache[key] =  value
        this.database.SetAsync(key, value)   
    }
    SetPlayerState(plr: PlayerState)
    {
        for(let i = 0; i < players.size(); i++)
        {
            if(players[i].userId === plr.userId)
            {
                players.remove(i)
            }
        }
        players.push(plr)
    }
    GetPlayerState(user: Player)
    {
        let player
        for(let i = 0; i < players.size(); i++)
        {
            if(players[i].userId === user.UserId)
            {
                player = players[i]
                break
            }
        }
        if(player === undefined)
        {
            player = player ?? this.database.GetAsync(tostring(user.UserId)) as PlayerState
            if(player === undefined)
            {
                player = new PlayerState
                (
                    user.UserId, 
                    25000,
                    new PlayerCard
                    (
                        0, 
                        "new"
                    ), 
                    new PlayerSettings
                    (
                        new PlayerKeySettings
                        (
                            "E",
                            "G",
                            "U"
                        )
                    ),
                    new PlayerInventory
                    (
                        5
                    )
                )
            }
            players.push(player)
        }
        return player
    }
    SavePlayerState(player: PlayerState)
    {
        let d = this.database
        d.SetAsync(tostring(player.userId), player)
    }
}
export { Database }