import { Node } from "shared/entities/node/node"
import { Placeable } from "shared/entities/node/placeable"
import { Client } from "../net/lib"

const tweenService = game.GetService("TweenService")

class BuildSystem
{   
    
    MakeNodeRepresentation(n?: Node, color?: Color3)
    {
        let nodeModel = new Instance("Model", game.GetService("Workspace"))
        nodeModel.Name = "temp-node-model"

        let nodePart = new Instance("Part", nodeModel)
        nodePart.Name = "temp-node-part"
        nodePart.Size = new Vector3(7.5, 10, 7.5)
        nodePart.Transparency = 0.7
        nodePart.Material = Enum.Material.Neon
        nodePart.CanCollide = false
        nodePart.Anchored = true
        nodePart.Color = color ?? Color3.fromRGB(255, 135, 135)
        nodeModel.PrimaryPart = nodePart

        if(n !== undefined)
        {
            let nodeRadius = new Instance("Part", nodeModel)
            nodeRadius.Shape = Enum.PartType.Ball
            nodeRadius.Name = "temp-node-radius"
            nodeRadius.Size = new Vector3(n.config.radius,  n.config.radius, n.config.radius).mul(2)
            nodeRadius.Transparency = 0.97
            nodeRadius.Material = Enum.Material.Neon
            nodeRadius.CanCollide = false
            nodeRadius.Anchored = true
            nodeRadius.Color = color ?? Color3.fromRGB(255, 135, 135)
            nodeModel.SetPrimaryPartCFrame(new CFrame(n.position))
        }

        return nodeModel
    }
    constructor(client: Client)
    {   this.client = client
    }
    client: Client
    isEnabled: boolean = false
    actualResult: CFrame = new CFrame(0, 0, 0)
    private allRenderedNodes: Array<Model> = new Array<Model>()
    private attachedModel: Model | undefined
    private connection: RBXScriptConnection | undefined
    private uisConnection: RBXScriptConnection | undefined
    private uisContConnection: RBXScriptConnection | undefined
    Enable(placeable: Placeable, pressedToReturn?: Enum.UserInputType, pressedToDisable?: Enum.KeyCode, node?: Node)
    {
        if(this.isEnabled)
        {
            this.Disable()
        }
        this.attachedModel = placeable.attachedModel.Clone()
        this.attachedModel.Parent = game.GetService("Workspace")
        this.attachedModel.Name = "temp-build-system-attachment"
        if(this.attachedModel.PrimaryPart !== undefined)
        {
            let actualPosition: Vector3
            let actualRotation: CFrame = CFrame.fromEulerAnglesXYZ(0, 0, 0)
            this.isEnabled = true
            let plr = game.GetService("Players").LocalPlayer
            let mouse = plr.GetMouse()
            let char = (plr.Character ?? plr.CharacterAdded.Wait()) as Instance
            let isValid = false
            let s = this

            let modelsDescendants = this.attachedModel.GetDescendants()
            for(let i = 0; i < modelsDescendants.size(); i++)
            {
                if(modelsDescendants[i].IsA("BasePart"))
                {
                    let thisPart = modelsDescendants[i] as BasePart
                    thisPart.Anchored = true
                    thisPart.CanCollide = false
                    tweenService.Create(thisPart, new TweenInfo(1), {Transparency: 0.6}).Play()
                }
            }
            this.uisConnection = game.GetService("UserInputService").InputEnded.Connect(function(inputObject, isProcessed)
            {
                if(!isProcessed && s.attachedModel !== undefined && s.attachedModel.PrimaryPart !== undefined)
                {
                    if(pressedToReturn !== undefined && inputObject.UserInputType === pressedToReturn && isValid)
                    {
                        if(node === undefined)
                        {
                            s.client.PlaceNode(actualPosition)
                            s.Disable()
                        }
                        else
                        {
                            s.client.PlacePlaceable(placeable, s.actualResult)
                            s.Disable()
                        }
                    }
                    else if(pressedToDisable !== undefined && inputObject.KeyCode === pressedToDisable)
                    {
                        s.Disable()
                    }
                }
            })
            this.uisContConnection = game.GetService("UserInputService").InputBegan.Connect(function(inputObject, isProcessed)
            {
                if(!isProcessed)
                {
                    let condition = true
                    if(inputObject.KeyCode === Enum.KeyCode.E)
                    {
                        let e = game.GetService("UserInputService").InputEnded.Connect(function(newInp, isP)
                        {
                            if(!isP && newInp.KeyCode === inputObject.KeyCode)
                            {
                                condition = false
                            }
                        })
                        while(condition && wait())
                        {
                            actualRotation = actualRotation.mul(CFrame.fromEulerAnglesXYZ(0, -0.25, 0))
                        }
                        e.Disconnect()
                    }
                    else if(inputObject.KeyCode === Enum.KeyCode.Q)
                    {
                        let e = game.GetService("UserInputService").InputEnded.Connect(function(newInp, isP)
                        {
                            if(!isP && newInp.KeyCode === inputObject.KeyCode)
                            {
                                condition = false
                            }
                        })
                        while(condition && wait())
                        {
                            actualRotation = actualRotation.mul(CFrame.fromEulerAnglesXYZ(0, 0.25, 0))
                        }
                        e.Disconnect()
                    }
                }
            })
            let allNodesInGame = this.client.GetAllOtherPlayersNodes() ?? new Array<Node>()
            for(let n = 0; n < allNodesInGame.size(); n++)
            {
                if(allNodesInGame[n].owner === plr.UserId)
                {
                    let thisNodeModel = s.MakeNodeRepresentation(allNodesInGame[n], Color3.fromRGB(180, 255, 180))
                    s.allRenderedNodes.push(thisNodeModel)
                }
                else
                {
                    let thisNodeModel = s.MakeNodeRepresentation(allNodesInGame[n])
                    s.allRenderedNodes.push(thisNodeModel)
                }
            }
            let thisRenderedNode: Model | undefined
            if(node !== undefined)
            {
                thisRenderedNode = s.MakeNodeRepresentation(undefined, Color3.fromRGB(180, 255, 180))
                s.allRenderedNodes.push(thisRenderedNode)
            }
            this.connection = game.GetService("RunService").RenderStepped.Connect(function(deltaTime)
            {
                if(s.attachedModel !== undefined)
                {
                    let ray = game.GetService("Workspace").CurrentCamera?.ScreenPointToRay(mouse.X, mouse.Y)
                    if(ray !== undefined && s.attachedModel.PrimaryPart !== undefined)
                    {
                        let raycastParams = new RaycastParams()
                        let ignore = new Array<Instance>()
                        ignore.push(s.attachedModel)
                        for(let i = 0; i < game.GetService("Players").GetPlayers().size(); i++)
                        {
                            let plrsChar = game.GetService("Players").GetPlayers()[i].Character
                            if(plrsChar !== undefined)
                            {
                                ignore.push(plrsChar)
                            }
                        }
                        for(let i = 0; i < s.allRenderedNodes.size(); i++)
                        {
                            ignore.push(s.allRenderedNodes[i])
                        }
                        raycastParams.FilterDescendantsInstances = ignore

                        raycastParams.FilterType = Enum.RaycastFilterType.Blacklist
                        let raycastResult = game.GetService("Workspace").Raycast(ray.Origin, ray.Direction.mul(1000), raycastParams)
                        if(raycastResult !== undefined)
                        {
                            actualPosition = raycastResult.Position.add(new Vector3(0, s.attachedModel.GetExtentsSize().div(2).Y, 0))
                            if(node !== undefined)
                            {                        
                                isValid = node.position.sub(s.attachedModel.PrimaryPart.Position).Magnitude <= node.config.radius
                            }
                            else if(allNodesInGame !== undefined)
                            {
                                if(allNodesInGame.size() <= 0)
                                {
                                    isValid = true
                                }
                                else
                                {
                                    let closestNode: Node | undefined
                                    for(let i = 0; i < allNodesInGame.size(); i++)
                                    {
                                        let thisN = allNodesInGame[i]
                                        if(closestNode === undefined || actualPosition.sub(thisN.position).Magnitude < actualPosition.sub(closestNode.position).Magnitude)
                                        {
                                            closestNode = thisN
                                        }
                                    }
                                    isValid = closestNode !== undefined && actualPosition.sub(closestNode.position).Magnitude >= closestNode.config.radius * 2
                                }
                            }
                            let colorToTweenTo = isValid ? Color3.fromRGB(135, 255, 135) : Color3.fromRGB(255, 135, 135)
                            let allDesc = s.attachedModel.GetDescendants()
                            for(let i = 0; i < allDesc.size(); i++)
                            {
                                let thisPart = allDesc[i]
                                if(thisPart.IsA("BasePart"))
                                {
                                    thisPart.Color = thisPart.Color.Lerp(colorToTweenTo, 0.3)
                                }
                            }
                            let fakePosition = s.attachedModel.PrimaryPart.CFrame.Lerp(new CFrame(actualPosition).mul(actualRotation), 0.3)
                            s.actualResult = (new CFrame(actualPosition).mul(actualRotation))
                            s.attachedModel.SetPrimaryPartCFrame(fakePosition)
                        }
                    }
                    else if(s.attachedModel.PrimaryPart === undefined)
                    {
                        //error("Primary part removed.")
                    }
                }
            })
        }
        else
        {
            error("No primary part exists on this model.")
        }
    }
    Disable()
    {
        this.isEnabled = false
        if(this.connection !== undefined)
        {
            this.connection.Disconnect()
        }
        if(this.uisConnection !== undefined)
        {
            this.uisConnection.Disconnect()
        }
        if(this.uisContConnection !== undefined)
        {
            this.uisContConnection.Disconnect()
        }
        for(let i = 0; i < this.allRenderedNodes.size(); i++)
        {
            let modelsDescendants = this.allRenderedNodes[i].GetDescendants()
            for(let i = 0; i < modelsDescendants.size(); i++)
            {
                if(modelsDescendants[i].IsA("BasePart"))
                {
                    let thisPart = modelsDescendants[i] as BasePart
                    tweenService.Create(thisPart, new TweenInfo(0.1), {Transparency: 1}).Play()
                }
            }
            let f = this
            coroutine.resume(coroutine.create(function()
            {
                wait(0.1)
                f.allRenderedNodes[i].Destroy()
            }))
        }
        if(this.attachedModel !== undefined)
        {
            let modelsDescendants = this.attachedModel.GetDescendants()
            for(let i = 0; i < modelsDescendants.size(); i++)
            {
                if(modelsDescendants[i].IsA("BasePart"))
                {
                    let thisPart = modelsDescendants[i] as BasePart
                    tweenService.Create(thisPart, new TweenInfo(0.1), {Transparency: 1}).Play()
                }
            }
            wait(0.1)
            this.attachedModel.Destroy()
        }
    }
}
export { BuildSystem }