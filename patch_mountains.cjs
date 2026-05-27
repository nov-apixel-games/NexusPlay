const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Render mountains!
const mountainCode = `                  ) : natureType === 'mountain' ? (
                    <group>
                      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
                        <coneGeometry args={[4, 5, 4]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                      </mesh>
                    </group>
                  ) : null}
`;

code = code.replace(`                  ) : null}`, mountainCode);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Mountains added!");
