import { Application, Assets, AnimatedSprite, Texture, TextStyle, Text, Sprite, Container } from 'pixi.js';
import constants from "./constants"

(async (): Promise<any> => {
    // Create a new application
    const app: Application = new Application();

    //For debugging in the browser
    globalThis.__PIXI_APP__ = app;

    // Initialize the application
    await app.init({
        width: constants.CANVAS_WIDTH,
        height: constants.CANVAS_HEIGHT
    });

    // Append the application canvas to the document body
    document.body.appendChild(app.canvas);

    // Load the spritesheet
    const jsonFile: any = await Assets.load("./assets/spritesheet/newCodingTaskAssets.json");
    
    // Create one game container to contain everything of the game
    const gameContainer: Container = new Container({
        label: "gameContainer"
    });
    app.stage.addChild(gameContainer)

    // Create and add the background first
    const backgroundSprite: Sprite = new Sprite({
        texture: jsonFile.textures[0],
        label: "Background"
    });
    gameContainer.addChild(backgroundSprite);

    // Create array with the textures of the slot symbols
    const slotTextures: Array<Texture> = [];

    for ( let i: number = 0; i < jsonFile._frames.length; i++ ) {
        let textureFilename: string = jsonFile._frames[i].filename;

        if ( textureFilename.match(/(symbol)/) ) { // Check whether the texture in the json is a slot symbol
            let regex: RegExp = /_(\w+)./
            let symbolName: string = regex.exec(textureFilename)[1];
            jsonFile.textures[i].label = symbolName;
            // jsonFile.textures[i].win = i;
            slotTextures.push(jsonFile.textures[i]);
        }
    }

    // Randomize the array with the textures of the slot symbols 
    for ( let i: number = slotTextures.length - 1; i > 0; i-- ) {
        const j: number = Math.floor(Math.random() * (i + 1));
        [slotTextures[i], slotTextures[j]] = [slotTextures[j], slotTextures[i]];
    }

    // Create two slot containers to animate one after other
    const slotContainerA: Container = new Container({
        label: "Slot container A"
    });
    const slotContainerB: Container = new Container({
        label: "Slot container B"
    });
    gameContainer.addChild(slotContainerA);
    gameContainer.addChild(slotContainerB);

    slotContainerA.position.x = 5 * constants.SYMBOL_SIZE;
    slotContainerB.position.x = 5 * constants.SYMBOL_SIZE;
    
    // Create array of slot sprites and fill the two slot containers with the slot sprites
    let slotSprites: Array<Sprite> = [];

    for ( let i: number = 0; i < Math.floor(slotTextures.length / 2); i++ ) {
        const j: number =  i + Math.floor(slotTextures.length / 2);
        
        slotSprites[i] = createSlotSprite(slotTextures[i], slotContainerA, i);
        slotSprites[j] = createSlotSprite(slotTextures[j], slotContainerB, i);
    }

    // Adjust slot sprites size
    slotSprites.map((el: Sprite): void => {
        el.width = constants.SYMBOL_SIZE;
        el.height = constants.SYMBOL_SIZE;
    })

    // Position the second slot container above the game container right after the first one and follow it
    slotContainerB.position.y = gameContainer.y - slotContainerB.height;

    // Create the win frame texture
    const winframeTexture: Texture = jsonFile.textures[13];
    const winframeSprite = new Sprite(winframeTexture);
    
    winframeSprite.position.x = slotContainerA.position.x;
    winframeSprite.position.y = 2 * constants.SYMBOL_SIZE;
    gameContainer.addChild(winframeSprite);
    
    // Set up the spin button
    const spinTexture: Texture = jsonFile.textures[1];
    const stopTexture: Texture = jsonFile.textures[2];
    const spinButton: Sprite = new Sprite(spinTexture);

    spinButton.interactive = true;
    spinButton.cursor = "pointer";
    spinButton.position.x = constants.CANVAS_WIDTH - spinButton.width - constants.SPINBUTTON_MARGIN;
    spinButton.position.y = constants.CANVAS_HEIGHT - spinButton.height - constants.SPINBUTTON_MARGIN;
    gameContainer.addChild(spinButton);

    // Set up the info container
    const infoContainer = new Container({
        x: 530,
        y: 310,
        label: "Info Container"
    });
    gameContainer.addChild(infoContainer);

    const style: TextStyle = new TextStyle({
        fontSize: 25,
        fontWeight: 'bold'
    })

    let balance: number = 100;
    let balanceText: Text = new Text({
        text: "Balance: $ " + balance,
        style: style,
        label: "Balance text"
    })

    const winText: Text = new Text({
        text: "",
        x: 60,
        y: 35,
        style: style,
        label: "Win text"
    })
    infoContainer.addChild(balanceText)
    infoContainer.addChild(winText)

    const winSymbolSprite = new Sprite({
        label: "Winning info symbol",
        y: 32   
    });
    winSymbolSprite.height = constants.SYMBOL_SIZE * 0.6;
    winSymbolSprite.width = constants.SYMBOL_SIZE * 0.6;
    infoContainer.addChild(winSymbolSprite);

    // Initialize the game
    let speed: number = 0;
    let play: boolean = false;
    let played: boolean = false;
    let timeOfSpinning: number = 1;

    spinButton.on("click", (): void => {
        if ( spinButton.texture === spinTexture ) {
            spinButton.texture = stopTexture;

            balance -= 10; // Pay for the spin
            updateBalance(balance);
            
            // Create random spinning time to randomize the winning symbol
            timeOfSpinning = Math.floor(Math.random() * 50 + 20);

            speed = 1;
            play = true;
        } else {
            spinButton.texture = spinTexture;
            speed = 0;
            play = false;
            played = true;
        }
    })

    // Improve performance
    app.ticker.maxFPS = 30;

    app.ticker.add((): void => {
        
        if ( play ) {
            timeOfSpinning--;
        };

        if ( timeOfSpinning === 0 ) {
            speed = 0;
            play = false;
            timeOfSpinning = 1;

            // Fix the winning symbol to fit exactly in the win frame
            if ( slotContainerA.position.y % constants.SYMBOL_SIZE != 0 ) {
                slotContainerA.y += constants.SYMBOL_SIZE - slotContainerA.position.y % constants.SYMBOL_SIZE;
                slotContainerB.y += constants.SYMBOL_SIZE - slotContainerB.position.y % constants.SYMBOL_SIZE;
            }
            spinButton.texture = spinTexture;
            played = true;
        };

        if ( played ) {
            let winningSymbolIndex: number;

            // Find the winnig symbol by the y coordinate of the slot containers
            if ( slotContainerA.y >= -2 * constants.SYMBOL_SIZE && slotContainerA.y <= 2 * constants.SYMBOL_SIZE) {
                winningSymbolIndex = Math.abs(slotContainerA.y - 160) / 80;
            } else {
                winningSymbolIndex = Math.abs(slotContainerB.y - 160) / 80 + 5;
            }

            // Update the info container after a spin
            winSymbolSprite.texture = slotSprites[winningSymbolIndex].texture;
            let win: number =  winningSymbolIndex * 10;

            winText.text = "wins: $ " + win;
            balance += win;
            updateBalance(balance);
            played = false;
        };

        // Vertical direction of the reel: 
        slotContainerA.position.y += 80 * speed;
        slotContainerB.position.y += 80 * speed;

        // If the slot container is under the game container, goes above it to follow the other slot container
        if (slotContainerA.position.y >= constants.GAME_CONTAINER_HEIGHT) {
            slotContainerA.position.y = gameContainer.position.y - slotContainerA.height;
        };
        if (slotContainerB.position.y >= constants.GAME_CONTAINER_HEIGHT) {
            slotContainerB.position.y = gameContainer.position.y - slotContainerB.height;
        };
    });

        
    function updateBalance(amount: number): void {
        balanceText.text = "Balance: $ " + amount;
    }
    
    function createSlotSprite(texture: Texture, parent: Container, index: number): Sprite {
        const sprite: Sprite = new Sprite(texture);
        sprite.label = texture.label;
        sprite.position.y = index * constants.SYMBOL_SIZE;
        parent.addChild(sprite);
        
        return sprite;
    }
})();