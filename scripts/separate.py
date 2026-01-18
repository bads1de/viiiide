"""
Audio Separator wrapper script for DirectML (AMD GPU) support
This script is called from the Node.js API to separate vocals from audio
"""

import sys
import json


def main():
    if len(sys.argv) < 4:
        print(
            json.dumps(
                {
                    "error": "Usage: python separate.py <input_audio> <output_dir> <model_dir>"
                }
            )
        )
        sys.exit(1)

    input_audio = sys.argv[1]
    output_dir = sys.argv[2]
    model_dir = sys.argv[3]

    # Import after args check to speed up error reporting
    from audio_separator.separator import Separator

    try:
        # Initialize with DirectML enabled for AMD GPU
        separator = Separator(
            output_dir=output_dir,
            model_file_dir=model_dir,
            output_format="WAV",
            output_single_stem="Vocals",
            use_directml=True,  # Enable AMD GPU acceleration
        )

        # Load model - UVR_MDXNET_KARA_2.onnx is fast and good quality
        separator.load_model(model_filename="UVR_MDXNET_KARA_2.onnx")

        # Perform separation
        output_files = separator.separate(input_audio)

        # Return the output file paths
        print(json.dumps({"success": True, "output_files": output_files}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
